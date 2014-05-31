var fs = require ('fs');
var os = require('os');
var child_process = require('child_process');
var path = require('path');

exports.install = function(env) {
  var app = env.app;
  var ensureAuthenticated = env.ensureAuthenticated;
  var ensurePathExists = env.ensurePathExists;
  var git = env.git;

  // is the current folder a git svn folder?
  app.get(env.httpPath + '/issvn', ensureAuthenticated, ensurePathExists,
          function(req, res) {
            var repoPath = req.param('path');
            var svnPath = path.join(repoPath, '.git', 'svn');
            if (fs.existsSync(svnPath))
              res.json({exists: true});
            else
              res.json({exists: false});
          }
  );

  // exec command and handle errors + pw entry
  var execAndHandleCmd = function(req, res, cmd, args, callback) {
    var repoPath = req.param('path');
    var pw = req.param('passwd');
    var err = "";
    var enteredPw = false;

    child = child_process.spawn(cmd, args, { cwd: repoPath });

    // on error data
    child.stderr.on('data', function(data) {
      err += data;

      if (data.toString().search("Password") != -1) {
        enteredPw = true

        if (pw != undefined)
          child.stdin.write(pw);
        child.stdin.end();
      }
    });


    child.on('exit', function (code) {
      if (code != 0) {
        console.log(cmd + " exited with error " + code + ": ");
        console.log(err);
        if (enteredPw) {
          res.json(400, {error: "wrong-password-error"});
          return;
        }
      }
      res.json({});

      if (callback) callback();
    });
  }

  // git svn rebase
  app.post(env.httpPath + '/svnRebase', ensureAuthenticated, ensurePathExists,
    function(req, res) {
      execAndHandleCmd(req, res, 'git', ['svn', 'rebase'], null);
    }
  );

  // git svn dcommit
  app.post(env.httpPath + '/svnCommit', ensureAuthenticated, ensurePathExists,
    function(req, res) {
      execAndHandleCmd(req, res, 'git', ['svn', 'dcommit'], null);
    }
  );

} // end exports.install




  // app.get(env.httpPath + '/gitSHA',
  //         function(req, res) {
  //           var repoPath = req.param('path');
  //           child = child_process.exec('git rev-parse --short HEAD', { cwd: repoPath });

  //           child.stdout.on('data', function(data) {
  //             res.json({gitsha: data.trim()});
  //           });
  //         }
  // );

  // app.get(env.httpPath + '/svnFetch',
  //         function(req, res) {
  //           var repoPath = req.param('path');
  //           var pw = req.param('passwd');
  //           child = child_process.exec('git svn fetch', { cwd: repoPath });

  //           child.stderr.on('data', function(data) {
  //             console.log("ERROR: " + data);

  //             if (data.toString().search("error") != -1) {
  //               res.json(400, {error: "password-needed-error"});
  //               return;
  //             }

  //             if (data.toString().search("Password") != -1) {
  //               if (pw != undefined)
  //                 child.stdin.write(pw);
  //               child.stdin.end();
  //               res.json({});
  //             }
  //           });

  //           child.stdout.on('end', function (err, stdout, stderr) {
  //             res.json({});
  //           });
  //         }
  // );

  // app.get(env.httpPath + '/svnSHA',
  //         function(req, res) {
  //           var repoPath = req.param('path');
  //           child = child_process.exec('git svn log --show-commit --limit=1 --oneline', { cwd: repoPath });


  //           child.stderr.on('data', function(data) {
  //             console.log("ERROR: " + data);
  //           });

  //           child.stdout.on('data', function(data) {
  //             var regex = /r[0-9]+ [|] (.*) [|] .*/
  //             var g = data.match(regex);
  //             res.json({svnsha: g[1].trim()});
  //           });
  //         }
  // );

  // app.get(env.httpPath + '/svnLog',
  //         function(req, res) {
  //           var repoPath = req.param('path');
  //           var message = "";
  //           child = child_process.exec('git svn log --limit=1', { cwd: repoPath });


  //           child.stdout.on('data', function(data) {
  //             message += data;
  //           });

  //           child.stdout.on('end', function() {
  //             res.json({msg: message});
  //           })
  //         }
  // );