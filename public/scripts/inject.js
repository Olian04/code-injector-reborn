/**
 * Dynamically injected page script.
 * Loaded via chrome.scripting.executeScript({ files: ['/scripts/inject.js'] }).
 * Kept as plain JS in public/ so Extension.js copies it with a stable path.
 */
(function (window) {
  // executeScript re-runs this file on every inject; skip re-registering.
  if (window.__codeInjectorListening) return;
  window.__codeInjectorListening = true;

  function appendEl(el) {
    (document.head || document.documentElement).append(el);
  }

  function injectJS(rule, cb) {
    var el = document.createElement('script');
    el.textContent = rule.code;
    appendEl(el);
    cb();
  }

  function injectCSS(rule, cb) {
    var el = document.createElement('style');
    el.textContent = rule.code;
    appendEl(el);
    cb();
  }

  function injectHTML(rule, cb) {
    function go() {
      if (!document.body) {
        document.addEventListener('DOMContentLoaded', go, { once: true });
        return;
      }
      var parser = new DOMParser();
      var doc = parser.parseFromString(rule.code, 'text/html');
      while (doc.body.firstChild) {
        document.body.append(doc.body.firstChild);
      }
      cb();
    }
    go();
  }

  function insertRules(rules) {
    var rule = rules.shift();
    if (rule === undefined) return;

    switch (rule.type) {
      case 'js':
        injectJS(rule, insertRules.bind(null, rules));
        break;
      case 'css':
        injectCSS(rule, insertRules.bind(null, rules));
        break;
      case 'html':
        injectHTML(rule, insertRules.bind(null, rules));
        break;
      default:
        insertRules(rules);
        break;
    }
  }

  function handleOnMessage(data, _sender, callback) {
    insertRules(data.onCommit.slice());

    if (document.readyState === 'complete') {
      insertRules(data.onLoad.slice());
    } else {
      window.addEventListener('load', function () {
        insertRules(data.onLoad.slice());
      });
    }

    if (typeof callback === 'function') return callback(true);
    return true;
  }

  try {
    var fallback = typeof chrome !== 'undefined' ? chrome : browser;
    fallback.runtime.onMessage.addListener(handleOnMessage);
  } catch (err) {
    console.error(
      '[Code-Injector] Failed to listen for messages, Injection failed.',
      err
    );
  }
})(window);
