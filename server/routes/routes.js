'use strict';

var mongoose = require('mongoose'),
  Circle = mongoose.model('Circle');
/* jshint -W098 */
// The Package is past automatically as first parameter
module.exports = function(Circles, app, auth, database) {
var meanio = require('meanio');

  app.get('/api/test', function(req, res) {
    meanio.db.find('Project', function(err, data) {
      console.log(err);
      console.log(data);
      console.log('here')
    });

    return;
  });


  app.get('/api/circles/visualize', function(req, res) {
    Circles.render('index', {}, function(err, html) {

      res.send(html);
    });
  });

  app.route('/api/circles/tree').get(function(req, res) {
    Circle.buildPermissions(function(data) {
      res.send({
        name: "flare",
        children: data.tree
      });
    })
  });

  app.route('/api/circles/:name?')
    .post(function(req, res, next) {

      var circle = new Circle(req.body);

      circle.save(function(err) {
        if (err) {
          return res.status(500).json({
            error: 'Cannot save the circle'
          });
        }

        Circle.buildPermissions(function(data) {
          app.set('circles', data);
        });

        res.json(circle);
      });
    })
    .put(function(req, res, next) {

      if (!req.params.id) {
        return res.send(404, 'No ID specified');
      }

      validateCircles(req.params.id, req.body.circles, function(err, status) {

        if (err) {
          return res.send(400, status);
        }

        Circle.findOne({
          name: req.params.name
        }).exec(function(err, circle) {
          if (!err && circle) {
            Circle.findOneAndUpdate({
              name: circle.name
            }, {
              $set: req.body
            }, {
              multi: false,
              upsert: false
            }, function(err, circle) {
              if (err) {
                return res.send(500, err.message);
              }

              Circle.buildPermissions(function(data) {
                app.set('circles', data);
              });

              res.send(200, 'updated');
            });
          }
        });
      });

    })
    .get(function(req, res, next) {
      var circles = app.get('circles');

      if (circles) {
        return res.send(circles);
      }

      Circle.buildPermissions(function(data) {
        app.set('circles', data);

        res.send(data);
      });

    });

  function validateCircles(id, circles, callback) {
    Circle.buildPermissions(function(data) {
      circles = [].concat(circles);
      circles.forEach(function(parent, index) {

        if (data.circles[id].decendants.indexOf(parent) !== -1) {
          return callback(true, 'Cannot reference parent in child relationship')
        }
        if (index === circles.length - 1) {
          return callback(null, 'valid');
        }
      });
    });
  }
};