var components = require('ungit-components');

// get original constructor of component 'remotes'
var remotesConstructor = components.registered['remotes'];

// register this as the new 'remotes' component (overwrite)
components.register('remotes', function(args) {

  // instance of old 'remotes' for preserving original functionality
  var remotes = remotesConstructor(args);
  var remotesUpdateNode = remotes.updateNode.bind(remotes);

  // store original 'onProgramEvent' for overwriting
  var remotesProgramEvent = remotes.onProgramEvent;

  // create new component
  var gitsvn = components.create('gitsvn', { remotesViewModel: remotes });

  // overwrite old 'updateNode' function with own one
  remotes.updateNode = function(parentElement) {

    //-- new node container
    var node = document.createElement('div');
    node.className = 'col';

    //-- container for original 'remotes' functionality
    var remotesNode = document.createElement('div');
    remotesNode.className = 'remotes-row';
    // render this node with template of original 'remotes'
    remotesUpdateNode(remotesNode);

    //-- container for plugin functionality
    var gitsvnNode = document.createElement('div');
    gitsvnNode.className = 'svn-row';
    // use own template for rendering
    gitsvn.updateNode(gitsvnNode);

    //-- glue original and plugin together
    node.appendChild(remotesNode);
    node.appendChild(gitsvnNode);
    return node;
  };

  //-- overwrite original 'onProgramEvent'
  remotes.onProgramEvent = function(event) {
    remotesProgramEvent(event);   // call original
    gitsvn.onProgramEvent(event); // call own
  }

  return remotes;
});
