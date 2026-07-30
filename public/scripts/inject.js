/**
 * Dynamically injected page script.
 * Loaded via chrome.scripting.executeScript({ files: ['/scripts/inject.js'] }).
 * Kept as plain JS in public/ so Extension.js copies it with a stable path.
 */
(function (window) {
  function appendCache(path) {
    return path + (path.indexOf('?') !== -1 ? '&' : '?') + 'cache=' + Date.now();
  }

  function injectJS(rule, cb) {
    if (rule.path) {
      var el = document.createElement('script');
      el.setAttribute('type', 'text/javascript');
      el.onload = cb;
      el.onerror = function () {
        console.error('Code-Injector [JS] - Error loading: ' + rule.path);
        cb();
      };
      el.src = appendCache(rule.path);
      document.head.append(el);
    } else {
      var el2 = document.createElement('script');
      el2.textContent = rule.code;
      document.head.append(el2);
      cb();
    }
  }

  function injectCSS(rule, cb) {
    if (rule.path) {
      var el = document.createElement('link');
      el.setAttribute('type', 'text/css');
      el.setAttribute('rel', 'stylesheet');
      el.onload = cb;
      el.onerror = function () {
        console.error('Code-Injector [CSS] - Error loading: ' + rule.path);
        cb();
      };
      el.href = appendCache(rule.path);
      document.head.append(el);
    } else {
      var el2 = document.createElement('style');
      el2.textContent = rule.code;
      document.head.append(el2);
      cb();
    }
  }

  function injectHTML(rule, cb) {
    if (rule.path) {
      console.error(
        'Code-Injector [HTML] - Error, Cannot request remote HTML files.'
      );
      cb();
    } else {
      var parser = new DOMParser();
      var doc = parser.parseFromString(rule.code, 'text/html');
      while (doc.body.firstChild) {
        document.body.append(doc.body.firstChild);
      }
      cb();
    }
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
