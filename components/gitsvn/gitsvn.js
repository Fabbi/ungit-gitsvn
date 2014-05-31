
var ko = require('knockout');
var _ = require('lodash');
var programEvents = require('ungit-program-events');

var components = require('ungit-components');

components.register('gitsvn', function(args) {
  return new GitsvnIntegrationViewModel(args.remotesViewModel);
});

/*
TODO:
  - deactivate buttons on git svn repo (checkout etc) or replace them
  -
*/

var GitsvnIntegrationViewModel = function(remotes) {
  this.remotes = remotes;
  this.repoPath = remotes.repoPath;
  this.server = remotes.server;
  // show only if current folder is a git svn repo
  this.show = ko.observable(false);

  // button states
  this.rebaseDisabled = ko.observable(false);
  this.commitDisabled = ko.observable(false);
  this.oldRebaseState = false;
  this.oldCommitState = false;

  // svn password (for https workaround (dirty :( )))
  this.svnPassword = ko.observable();
  this.showPasswordField = ko.observable(false);

  // progressbar on rebase button
  this.rebaseProgressBar = components.create('progressBar',
    {
      predictionMemoryKey: 'gitsvn-rebase-' + remotes.repoPath,
      fallbackPredictedTimeMs: 4000,
      temporary: true
    }
  );

  // progressbar on commit button
  this.commitProgressBar = components.create('progressBar',
    {
      predictionMemoryKey: 'gitsvn-commit-' + remotes.repoPath,
      fallbackPredictedTimeMs: 4000,
      temporary: true
    }
  );


  // test if folder is a git repo
  this.isGitSVN();
}

GitsvnIntegrationViewModel.prototype.updateNode = function(parentElement) {
  ko.renderTemplate('gitsvn', this, {}, parentElement);
}

// current folder git svn folder?
GitsvnIntegrationViewModel.prototype.isGitSVN = function() {
  var self = this;
  this.server.get('/plugins/gitsvn/issvn',
    { path: this.repoPath },
    function(err, svn) {
      self.show(svn.exists);
    }
  );
}

// store current state of buttons and disable commit and rebase buttons
GitsvnIntegrationViewModel.prototype.disableAndStore = function() {
  this.oldRebaseState = this.rebaseDisabled();
  this.oldCommitState = this.commitDisabled();
  this.rebaseDisabled(true);
  this.commitDisabled(true);
}

// git svn rebase
GitsvnIntegrationViewModel.prototype.svnRebase = function() {
  var options = {
    path: this.repoPath,
    passwd: this.svnPassword()
  }
  this.commitProgressBar.start();
  this.server.post('/plugins/gitsvn/svnRebase', options, cb);


  // callback function
  var cb = function(err) {
    this.commitProgressBar.stop();

    if (err && err.error == "password-needed-error") {
      console.log("Need a password");
      this.disableAndStore();
      return true;
    }

    programEvents.dispatch({ event: 'request-app-content-refresh'});
  }
}

// git svn commit
GitsvnIntegrationViewModel.prototype.svnCommit = function() {
  var options = {
    path: this.repoPath,
    passwd: this.svnPassword()
  }
  this.commitProgressBar.start();
  this.server.post('/plugins/gitsvn/svnCommit', options, cb);


  // callback function
  var cb = function(err) {
    this.commitProgressBar.stop();

    if (err && err.error == "password-needed-error") {
      console.log("Need a password");
      this.disableAndStore();
      return true;
    }

    programEvents.dispatch({ event: 'request-app-content-refresh'});
  }
}

// is beein called after entering password
GitsvnIntegrationViewModel.prototype.login = function() {
  this.showPasswordField(false);
  this.rebaseDisabled(this.oldRebaseState);
  this.commitDisabled(this.oldCommitState);
}

// for programevent handling (not yet in use)
GitsvnIntegrationViewModel.prototype.onProgramEvent = function(event) {
  var self = this;
  if (event.event == 'working-tree-changed') {

  }
  // schaue ob remote änderungen vorhanden sind
}


// // get current git commit sha
// GitsvnIntegrationViewModel.prototype.getGitSHA = function(callback) {
//   var self = this;
//   this.server.get('/plugins/gitsvn/gitSHA', { path: this.repoPath },
//     function(err, data) {
//       self.gitSHA = data.gitsha;
//       if (callback) callback();
//     });
// }

// // get current svn git sha
// GitsvnIntegrationViewModel.prototype.getSvnSHA = function(callback) {
//   var self = this;
//   this.server.get('/plugins/gitsvn/svnSHA', { path: this.repoPath },
//     function(err, data) {
//       self.svnSHA = data.svnsha;
//       if (callback) callback();
//     });
// }

// // git svn fetch
// GitsvnIntegrationViewModel.prototype.svnFetch = function(callback) {
//   var self = this;
//   this.server.post('/plugins/gitsvn/svnFetch', { path: this.repoPath, passwd: this.svnPassword() },
//     function(err) {
//       if (err) {
//         console.log("Need a password");
//         self.oldRebaseState = self.rebaseDisabled();
//         self.oldCommitState = self.commitDisabled();
//         self.rebaseDisabled(true);
//         self.commitDisabled(true);
//         return true;
//       }
//       if (callback) callback();
//     }
//   );
// }