/**
 * skylark-zxcvbn - A version of zxcvbn.js that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-zxcvbn/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx/skylark");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-zxcvbn/time_estimates',[],function(){
  var time_estimates;

  time_estimates = {
    estimate_attack_times: function(guesses) {
      var crack_times_display, crack_times_seconds, scenario, seconds;
      crack_times_seconds = {
        online_throttling_100_per_hour: guesses / (100 / 3600),
        online_no_throttling_10_per_second: guesses / 10,
        offline_slow_hashing_1e4_per_second: guesses / 1e4,
        offline_fast_hashing_1e10_per_second: guesses / 1e10
      };
      crack_times_display = {};
      for (scenario in crack_times_seconds) {
        seconds = crack_times_seconds[scenario];
        crack_times_display[scenario] = this.display_time(seconds);
      }
      return {
        crack_times_seconds: crack_times_seconds,
        crack_times_display: crack_times_display,
        score: this.guesses_to_score(guesses)
      };
    },
    guesses_to_score: function(guesses) {
      var DELTA;
      DELTA = 5;
      if (guesses < 1e3 + DELTA) {
        // risky password: "too guessable"
        return 0;
      } else if (guesses < 1e6 + DELTA) {
        // modest protection from throttled online attacks: "very guessable"
        return 1;
      } else if (guesses < 1e8 + DELTA) {
        // modest protection from unthrottled online attacks: "somewhat guessable"
        return 2;
      } else if (guesses < 1e10 + DELTA) {
        // modest protection from offline attacks: "safely unguessable"
        // assuming a salted, slow hash function like bcrypt, scrypt, PBKDF2, argon, etc
        return 3;
      } else {
        // strong protection from offline attacks under same scenario: "very unguessable"
        return 4;
      }
    },
    display_time: function(seconds) {
      var base, century, day, display_num, display_str, hour, minute, month, year;
      minute = 60;
      hour = minute * 60;
      day = hour * 24;
      month = day * 31;
      year = month * 12;
      century = year * 100;
      [display_num, display_str] = seconds < 1 ? [null, 'less than a second'] : seconds < minute ? (base = Math.round(seconds), [base, `${base} second`]) : seconds < hour ? (base = Math.round(seconds / minute), [base, `${base} minute`]) : seconds < day ? (base = Math.round(seconds / hour), [base, `${base} hour`]) : seconds < month ? (base = Math.round(seconds / day), [base, `${base} day`]) : seconds < year ? (base = Math.round(seconds / month), [base, `${base} month`]) : seconds < century ? (base = Math.round(seconds / year), [base, `${base} year`]) : [null, 'centuries'];
      if ((display_num != null) && display_num !== 1) {
        display_str += 's';
      }
      return display_str;
    }
  };

  return time_estimates;
});

define('skylark-zxcvbn/adjacency_graphs',[],function(){
	// generated by scripts/build_keyboard_adjacency_graphs.py
	var adjacency_graphs;

	adjacency_graphs = {
	  qwerty: {
	    "!": ["`~", null, null, "2@", "qQ", null],
	    "\"": [";:", "[{", "]}", null, null, "/?"],
	    "#": ["2@", null, null, "4$", "eE", "wW"],
	    "$": ["3#", null, null, "5%", "rR", "eE"],
	    "%": ["4$", null, null, "6^", "tT", "rR"],
	    "&": ["6^", null, null, "8*", "uU", "yY"],
	    "'": [";:", "[{", "]}", null, null, "/?"],
	    "(": ["8*", null, null, "0)", "oO", "iI"],
	    ")": ["9(", null, null, "-_", "pP", "oO"],
	    "*": ["7&", null, null, "9(", "iI", "uU"],
	    "+": ["-_", null, null, null, "]}", "[{"],
	    ",": ["mM", "kK", "lL", ".>", null, null],
	    "-": ["0)", null, null, "=+", "[{", "pP"],
	    ".": [",<", "lL", ";:", "/?", null, null],
	    "/": [".>", ";:", "'\"", null, null, null],
	    "0": ["9(", null, null, "-_", "pP", "oO"],
	    "1": ["`~", null, null, "2@", "qQ", null],
	    "2": ["1!", null, null, "3#", "wW", "qQ"],
	    "3": ["2@", null, null, "4$", "eE", "wW"],
	    "4": ["3#", null, null, "5%", "rR", "eE"],
	    "5": ["4$", null, null, "6^", "tT", "rR"],
	    "6": ["5%", null, null, "7&", "yY", "tT"],
	    "7": ["6^", null, null, "8*", "uU", "yY"],
	    "8": ["7&", null, null, "9(", "iI", "uU"],
	    "9": ["8*", null, null, "0)", "oO", "iI"],
	    ":": ["lL", "pP", "[{", "'\"", "/?", ".>"],
	    ";": ["lL", "pP", "[{", "'\"", "/?", ".>"],
	    "<": ["mM", "kK", "lL", ".>", null, null],
	    "=": ["-_", null, null, null, "]}", "[{"],
	    ">": [",<", "lL", ";:", "/?", null, null],
	    "?": [".>", ";:", "'\"", null, null, null],
	    "@": ["1!", null, null, "3#", "wW", "qQ"],
	    "A": [null, "qQ", "wW", "sS", "zZ", null],
	    "B": ["vV", "gG", "hH", "nN", null, null],
	    "C": ["xX", "dD", "fF", "vV", null, null],
	    "D": ["sS", "eE", "rR", "fF", "cC", "xX"],
	    "E": ["wW", "3#", "4$", "rR", "dD", "sS"],
	    "F": ["dD", "rR", "tT", "gG", "vV", "cC"],
	    "G": ["fF", "tT", "yY", "hH", "bB", "vV"],
	    "H": ["gG", "yY", "uU", "jJ", "nN", "bB"],
	    "I": ["uU", "8*", "9(", "oO", "kK", "jJ"],
	    "J": ["hH", "uU", "iI", "kK", "mM", "nN"],
	    "K": ["jJ", "iI", "oO", "lL", ",<", "mM"],
	    "L": ["kK", "oO", "pP", ";:", ".>", ",<"],
	    "M": ["nN", "jJ", "kK", ",<", null, null],
	    "N": ["bB", "hH", "jJ", "mM", null, null],
	    "O": ["iI", "9(", "0)", "pP", "lL", "kK"],
	    "P": ["oO", "0)", "-_", "[{", ";:", "lL"],
	    "Q": [null, "1!", "2@", "wW", "aA", null],
	    "R": ["eE", "4$", "5%", "tT", "fF", "dD"],
	    "S": ["aA", "wW", "eE", "dD", "xX", "zZ"],
	    "T": ["rR", "5%", "6^", "yY", "gG", "fF"],
	    "U": ["yY", "7&", "8*", "iI", "jJ", "hH"],
	    "V": ["cC", "fF", "gG", "bB", null, null],
	    "W": ["qQ", "2@", "3#", "eE", "sS", "aA"],
	    "X": ["zZ", "sS", "dD", "cC", null, null],
	    "Y": ["tT", "6^", "7&", "uU", "hH", "gG"],
	    "Z": [null, "aA", "sS", "xX", null, null],
	    "[": ["pP", "-_", "=+", "]}", "'\"", ";:"],
	    "\\": ["]}", null, null, null, null, null],
	    "]": ["[{", "=+", null, "\\|", null, "'\""],
	    "^": ["5%", null, null, "7&", "yY", "tT"],
	    "_": ["0)", null, null, "=+", "[{", "pP"],
	    "`": [null, null, null, "1!", null, null],
	    "a": [null, "qQ", "wW", "sS", "zZ", null],
	    "b": ["vV", "gG", "hH", "nN", null, null],
	    "c": ["xX", "dD", "fF", "vV", null, null],
	    "d": ["sS", "eE", "rR", "fF", "cC", "xX"],
	    "e": ["wW", "3#", "4$", "rR", "dD", "sS"],
	    "f": ["dD", "rR", "tT", "gG", "vV", "cC"],
	    "g": ["fF", "tT", "yY", "hH", "bB", "vV"],
	    "h": ["gG", "yY", "uU", "jJ", "nN", "bB"],
	    "i": ["uU", "8*", "9(", "oO", "kK", "jJ"],
	    "j": ["hH", "uU", "iI", "kK", "mM", "nN"],
	    "k": ["jJ", "iI", "oO", "lL", ",<", "mM"],
	    "l": ["kK", "oO", "pP", ";:", ".>", ",<"],
	    "m": ["nN", "jJ", "kK", ",<", null, null],
	    "n": ["bB", "hH", "jJ", "mM", null, null],
	    "o": ["iI", "9(", "0)", "pP", "lL", "kK"],
	    "p": ["oO", "0)", "-_", "[{", ";:", "lL"],
	    "q": [null, "1!", "2@", "wW", "aA", null],
	    "r": ["eE", "4$", "5%", "tT", "fF", "dD"],
	    "s": ["aA", "wW", "eE", "dD", "xX", "zZ"],
	    "t": ["rR", "5%", "6^", "yY", "gG", "fF"],
	    "u": ["yY", "7&", "8*", "iI", "jJ", "hH"],
	    "v": ["cC", "fF", "gG", "bB", null, null],
	    "w": ["qQ", "2@", "3#", "eE", "sS", "aA"],
	    "x": ["zZ", "sS", "dD", "cC", null, null],
	    "y": ["tT", "6^", "7&", "uU", "hH", "gG"],
	    "z": [null, "aA", "sS", "xX", null, null],
	    "{": ["pP", "-_", "=+", "]}", "'\"", ";:"],
	    "|": ["]}", null, null, null, null, null],
	    "}": ["[{", "=+", null, "\\|", null, "'\""],
	    "~": [null, null, null, "1!", null, null]
	  },
	  dvorak: {
	    "!": ["`~", null, null, "2@", "'\"", null],
	    "\"": [null, "1!", "2@", ",<", "aA", null],
	    "#": ["2@", null, null, "4$", ".>", ",<"],
	    "$": ["3#", null, null, "5%", "pP", ".>"],
	    "%": ["4$", null, null, "6^", "yY", "pP"],
	    "&": ["6^", null, null, "8*", "gG", "fF"],
	    "'": [null, "1!", "2@", ",<", "aA", null],
	    "(": ["8*", null, null, "0)", "rR", "cC"],
	    ")": ["9(", null, null, "[{", "lL", "rR"],
	    "*": ["7&", null, null, "9(", "cC", "gG"],
	    "+": ["/?", "]}", null, "\\|", null, "-_"],
	    ",": ["'\"", "2@", "3#", ".>", "oO", "aA"],
	    "-": ["sS", "/?", "=+", null, null, "zZ"],
	    ".": [",<", "3#", "4$", "pP", "eE", "oO"],
	    "/": ["lL", "[{", "]}", "=+", "-_", "sS"],
	    "0": ["9(", null, null, "[{", "lL", "rR"],
	    "1": ["`~", null, null, "2@", "'\"", null],
	    "2": ["1!", null, null, "3#", ",<", "'\""],
	    "3": ["2@", null, null, "4$", ".>", ",<"],
	    "4": ["3#", null, null, "5%", "pP", ".>"],
	    "5": ["4$", null, null, "6^", "yY", "pP"],
	    "6": ["5%", null, null, "7&", "fF", "yY"],
	    "7": ["6^", null, null, "8*", "gG", "fF"],
	    "8": ["7&", null, null, "9(", "cC", "gG"],
	    "9": ["8*", null, null, "0)", "rR", "cC"],
	    ":": [null, "aA", "oO", "qQ", null, null],
	    ";": [null, "aA", "oO", "qQ", null, null],
	    "<": ["'\"", "2@", "3#", ".>", "oO", "aA"],
	    "=": ["/?", "]}", null, "\\|", null, "-_"],
	    ">": [",<", "3#", "4$", "pP", "eE", "oO"],
	    "?": ["lL", "[{", "]}", "=+", "-_", "sS"],
	    "@": ["1!", null, null, "3#", ",<", "'\""],
	    "A": [null, "'\"", ",<", "oO", ";:", null],
	    "B": ["xX", "dD", "hH", "mM", null, null],
	    "C": ["gG", "8*", "9(", "rR", "tT", "hH"],
	    "D": ["iI", "fF", "gG", "hH", "bB", "xX"],
	    "E": ["oO", ".>", "pP", "uU", "jJ", "qQ"],
	    "F": ["yY", "6^", "7&", "gG", "dD", "iI"],
	    "G": ["fF", "7&", "8*", "cC", "hH", "dD"],
	    "H": ["dD", "gG", "cC", "tT", "mM", "bB"],
	    "I": ["uU", "yY", "fF", "dD", "xX", "kK"],
	    "J": ["qQ", "eE", "uU", "kK", null, null],
	    "K": ["jJ", "uU", "iI", "xX", null, null],
	    "L": ["rR", "0)", "[{", "/?", "sS", "nN"],
	    "M": ["bB", "hH", "tT", "wW", null, null],
	    "N": ["tT", "rR", "lL", "sS", "vV", "wW"],
	    "O": ["aA", ",<", ".>", "eE", "qQ", ";:"],
	    "P": [".>", "4$", "5%", "yY", "uU", "eE"],
	    "Q": [";:", "oO", "eE", "jJ", null, null],
	    "R": ["cC", "9(", "0)", "lL", "nN", "tT"],
	    "S": ["nN", "lL", "/?", "-_", "zZ", "vV"],
	    "T": ["hH", "cC", "rR", "nN", "wW", "mM"],
	    "U": ["eE", "pP", "yY", "iI", "kK", "jJ"],
	    "V": ["wW", "nN", "sS", "zZ", null, null],
	    "W": ["mM", "tT", "nN", "vV", null, null],
	    "X": ["kK", "iI", "dD", "bB", null, null],
	    "Y": ["pP", "5%", "6^", "fF", "iI", "uU"],
	    "Z": ["vV", "sS", "-_", null, null, null],
	    "[": ["0)", null, null, "]}", "/?", "lL"],
	    "\\": ["=+", null, null, null, null, null],
	    "]": ["[{", null, null, null, "=+", "/?"],
	    "^": ["5%", null, null, "7&", "fF", "yY"],
	    "_": ["sS", "/?", "=+", null, null, "zZ"],
	    "`": [null, null, null, "1!", null, null],
	    "a": [null, "'\"", ",<", "oO", ";:", null],
	    "b": ["xX", "dD", "hH", "mM", null, null],
	    "c": ["gG", "8*", "9(", "rR", "tT", "hH"],
	    "d": ["iI", "fF", "gG", "hH", "bB", "xX"],
	    "e": ["oO", ".>", "pP", "uU", "jJ", "qQ"],
	    "f": ["yY", "6^", "7&", "gG", "dD", "iI"],
	    "g": ["fF", "7&", "8*", "cC", "hH", "dD"],
	    "h": ["dD", "gG", "cC", "tT", "mM", "bB"],
	    "i": ["uU", "yY", "fF", "dD", "xX", "kK"],
	    "j": ["qQ", "eE", "uU", "kK", null, null],
	    "k": ["jJ", "uU", "iI", "xX", null, null],
	    "l": ["rR", "0)", "[{", "/?", "sS", "nN"],
	    "m": ["bB", "hH", "tT", "wW", null, null],
	    "n": ["tT", "rR", "lL", "sS", "vV", "wW"],
	    "o": ["aA", ",<", ".>", "eE", "qQ", ";:"],
	    "p": [".>", "4$", "5%", "yY", "uU", "eE"],
	    "q": [";:", "oO", "eE", "jJ", null, null],
	    "r": ["cC", "9(", "0)", "lL", "nN", "tT"],
	    "s": ["nN", "lL", "/?", "-_", "zZ", "vV"],
	    "t": ["hH", "cC", "rR", "nN", "wW", "mM"],
	    "u": ["eE", "pP", "yY", "iI", "kK", "jJ"],
	    "v": ["wW", "nN", "sS", "zZ", null, null],
	    "w": ["mM", "tT", "nN", "vV", null, null],
	    "x": ["kK", "iI", "dD", "bB", null, null],
	    "y": ["pP", "5%", "6^", "fF", "iI", "uU"],
	    "z": ["vV", "sS", "-_", null, null, null],
	    "{": ["0)", null, null, "]}", "/?", "lL"],
	    "|": ["=+", null, null, null, null, null],
	    "}": ["[{", null, null, null, "=+", "/?"],
	    "~": [null, null, null, "1!", null, null]
	  },
	  keypad: {
	    "*": ["/", null, null, null, "-", "+", "9", "8"],
	    "+": ["9", "*", "-", null, null, null, null, "6"],
	    "-": ["*", null, null, null, null, null, "+", "9"],
	    ".": ["0", "2", "3", null, null, null, null, null],
	    "/": [null, null, null, null, "*", "9", "8", "7"],
	    "0": [null, "1", "2", "3", ".", null, null, null],
	    "1": [null, null, "4", "5", "2", "0", null, null],
	    "2": ["1", "4", "5", "6", "3", ".", "0", null],
	    "3": ["2", "5", "6", null, null, null, ".", "0"],
	    "4": [null, null, "7", "8", "5", "2", "1", null],
	    "5": ["4", "7", "8", "9", "6", "3", "2", "1"],
	    "6": ["5", "8", "9", "+", null, null, "3", "2"],
	    "7": [null, null, null, "/", "8", "5", "4", null],
	    "8": ["7", null, "/", "*", "9", "6", "5", "4"],
	    "9": ["8", "/", "*", "-", "+", null, "6", "5"]
	  },
	  mac_keypad: {
	    "*": ["/", null, null, null, null, null, "-", "9"],
	    "+": ["6", "9", "-", null, null, null, null, "3"],
	    "-": ["9", "/", "*", null, null, null, "+", "6"],
	    ".": ["0", "2", "3", null, null, null, null, null],
	    "/": ["=", null, null, null, "*", "-", "9", "8"],
	    "0": [null, "1", "2", "3", ".", null, null, null],
	    "1": [null, null, "4", "5", "2", "0", null, null],
	    "2": ["1", "4", "5", "6", "3", ".", "0", null],
	    "3": ["2", "5", "6", "+", null, null, ".", "0"],
	    "4": [null, null, "7", "8", "5", "2", "1", null],
	    "5": ["4", "7", "8", "9", "6", "3", "2", "1"],
	    "6": ["5", "8", "9", "-", "+", null, "3", "2"],
	    "7": [null, null, null, "=", "8", "5", "4", null],
	    "8": ["7", null, "=", "/", "9", "6", "5", "4"],
	    "9": ["8", "=", "/", "*", "-", "+", "6", "5"],
	    "=": [null, null, null, null, "/", "9", "8", "7"]
	  }
	};

	return adjacency_graphs;
});

define('skylark-zxcvbn/scoring',[
  './adjacency_graphs'
],function(adjacency_graphs){

  var BRUTEFORCE_CARDINALITY, MIN_GUESSES_BEFORE_GROWING_SEQUENCE, MIN_SUBMATCH_GUESSES_MULTI_CHAR, MIN_SUBMATCH_GUESSES_SINGLE_CHAR, adjacency_graphs, calc_average_degree, k, scoring, v;

  // on qwerty, 'g' has degree 6, being adjacent to 'ftyhbv'. '\' has degree 1.
  // this calculates the average over all keys.
  calc_average_degree = function(graph) {
    var average, k, key, n, neighbors, v;
    average = 0;
    for (key in graph) {
      neighbors = graph[key];
      average += ((function() {
        var len, o, results;
        results = [];
        for (o = 0, len = neighbors.length; o < len; o++) {
          n = neighbors[o];
          if (n) {
            results.push(n);
          }
        }
        return results;
      })()).length;
    }
    average /= ((function() {
      var results;
      results = [];
      for (k in graph) {
        v = graph[k];
        results.push(k);
      }
      return results;
    })()).length;
    return average;
  };

  BRUTEFORCE_CARDINALITY = 10;

  MIN_GUESSES_BEFORE_GROWING_SEQUENCE = 10000;

  MIN_SUBMATCH_GUESSES_SINGLE_CHAR = 10;

  MIN_SUBMATCH_GUESSES_MULTI_CHAR = 50;

  scoring = {
    nCk: function(n, k) {
      var d, o, r, ref;
      if (k > n) {
        // http://blog.plover.com/math/choose.html
        return 0;
      }
      if (k === 0) {
        return 1;
      }
      r = 1;
      for (d = o = 1, ref = k; (1 <= ref ? o <= ref : o >= ref); d = 1 <= ref ? ++o : --o) {
        r *= n;
        r /= d;
        n -= 1;
      }
      return r;
    },
    log10: function(n) {
      return Math.log(n) / Math.log(10); // IE doesn't support Math.log10 :(
    },
    log2: function(n) {
      return Math.log(n) / Math.log(2);
    },
    factorial: function(n) {
      var f, i, o, ref;
      if (n < 2) {
        // unoptimized, called only on small n
        return 1;
      }
      f = 1;
      for (i = o = 2, ref = n; (2 <= ref ? o <= ref : o >= ref); i = 2 <= ref ? ++o : --o) {
        f *= i;
      }
      return f;
    },
    // ------------------------------------------------------------------------------
    // search --- most guessable match sequence -------------------------------------
    // ------------------------------------------------------------------------------

    // takes a sequence of overlapping matches, returns the non-overlapping sequence with
    // minimum guesses. the following is a O(l_max * (n + m)) dynamic programming algorithm
    // for a length-n password with m candidate matches. l_max is the maximum optimal
    // sequence length spanning each prefix of the password. In practice it rarely exceeds 5 and the
    // search terminates rapidly.

    // the optimal "minimum guesses" sequence is here defined to be the sequence that
    // minimizes the following function:

    //    g = l! * Product(m.guesses for m in sequence) + D^(l - 1)

    // where l is the length of the sequence.

    // the factorial term is the number of ways to order l patterns.

    // the D^(l-1) term is another length penalty, roughly capturing the idea that an
    // attacker will try lower-length sequences first before trying length-l sequences.

    // for example, consider a sequence that is date-repeat-dictionary.
    //  - an attacker would need to try other date-repeat-dictionary combinations,
    //    hence the product term.
    //  - an attacker would need to try repeat-date-dictionary, dictionary-repeat-date,
    //    ..., hence the factorial term.
    //  - an attacker would also likely try length-1 (dictionary) and length-2 (dictionary-date)
    //    sequences before length-3. assuming at minimum D guesses per pattern type,
    //    D^(l-1) approximates Sum(D^i for i in [1..l-1]

    // ------------------------------------------------------------------------------
    most_guessable_match_sequence: function(password, matches, _exclude_additive = false) {
      var _, bruteforce_update, guesses, k, l, len, len1, len2, lst, m, make_bruteforce_match, matches_by_j, n, o, optimal, optimal_l, optimal_match_sequence, q, ref, ref1, u, unwind, update, w;
      n = password.length;
      // partition matches into sublists according to ending index j
      matches_by_j = (function() {
        var o, ref, results;
        results = [];
        for (_ = o = 0, ref = n; (0 <= ref ? o < ref : o > ref); _ = 0 <= ref ? ++o : --o) {
          results.push([]);
        }
        return results;
      })();
      for (o = 0, len = matches.length; o < len; o++) {
        m = matches[o];
        matches_by_j[m.j].push(m);
      }
  // small detail: for deterministic output, sort each sublist by i.
      for (q = 0, len1 = matches_by_j.length; q < len1; q++) {
        lst = matches_by_j[q];
        lst.sort(function(m1, m2) {
          return m1.i - m2.i;
        });
      }
      optimal = {
        // optimal.m[k][l] holds final match in the best length-l match sequence covering the
        // password prefix up to k, inclusive.
        // if there is no length-l sequence that scores better (fewer guesses) than
        // a shorter match sequence spanning the same prefix, optimal.m[k][l] is undefined.
        m: (function() {
          var ref, results, u;
          results = [];
          for (_ = u = 0, ref = n; (0 <= ref ? u < ref : u > ref); _ = 0 <= ref ? ++u : --u) {
            results.push({});
          }
          return results;
        })(),
        // same structure as optimal.m -- holds the product term Prod(m.guesses for m in sequence).
        // optimal.pi allows for fast (non-looping) updates to the minimization function.
        pi: (function() {
          var ref, results, u;
          results = [];
          for (_ = u = 0, ref = n; (0 <= ref ? u < ref : u > ref); _ = 0 <= ref ? ++u : --u) {
            results.push({});
          }
          return results;
        })(),
        // same structure as optimal.m -- holds the overall metric.
        g: (function() {
          var ref, results, u;
          results = [];
          for (_ = u = 0, ref = n; (0 <= ref ? u < ref : u > ref); _ = 0 <= ref ? ++u : --u) {
            results.push({});
          }
          return results;
        })()
      };
      // helper: considers whether a length-l sequence ending at match m is better (fewer guesses)
      // than previously encountered sequences, updating state if so.
      update = (m, l) => {
        var competing_g, competing_l, g, k, pi, ref;
        k = m.j;
        pi = this.estimate_guesses(m, password);
        if (l > 1) {
          // we're considering a length-l sequence ending with match m:
          // obtain the product term in the minimization function by multiplying m's guesses
          // by the product of the length-(l-1) sequence ending just before m, at m.i - 1.
          pi *= optimal.pi[m.i - 1][l - 1];
        }
        // calculate the minimization func
        g = this.factorial(l) * pi;
        if (!_exclude_additive) {
          g += Math.pow(MIN_GUESSES_BEFORE_GROWING_SEQUENCE, l - 1);
        }
        ref = optimal.g[k];
        // update state if new best.
        // first see if any competing sequences covering this prefix, with l or fewer matches,
        // fare better than this sequence. if so, skip it and return.
        for (competing_l in ref) {
          competing_g = ref[competing_l];
          if (competing_l > l) {
            continue;
          }
          if (competing_g <= g) {
            return;
          }
        }
        // this sequence might be part of the final optimal sequence.
        optimal.g[k][l] = g;
        optimal.m[k][l] = m;
        return optimal.pi[k][l] = pi;
      };
      // helper: evaluate bruteforce matches ending at k.
      bruteforce_update = (k) => {
        var i, l, last_m, ref, results, u;
        // see if a single bruteforce match spanning the k-prefix is optimal.
        m = make_bruteforce_match(0, k);
        update(m, 1);
        results = [];
        for (i = u = 1, ref = k; (1 <= ref ? u <= ref : u >= ref); i = 1 <= ref ? ++u : --u) {
          // generate k bruteforce matches, spanning from (i=1, j=k) up to (i=k, j=k).
          // see if adding these new matches to any of the sequences in optimal[i-1]
          // leads to new bests.
          m = make_bruteforce_match(i, k);
          results.push((function() {
            var ref1, results1;
            ref1 = optimal.m[i - 1];
            results1 = [];
            for (l in ref1) {
              last_m = ref1[l];
              l = parseInt(l);
              if (last_m.pattern === 'bruteforce') {
                // corner: an optimal sequence will never have two adjacent bruteforce matches.
                // it is strictly better to have a single bruteforce match spanning the same region:
                // same contribution to the guess product with a lower length.
                // --> safe to skip those cases.
                continue;
              }
              // try adding m to this length-l sequence.
              results1.push(update(m, l + 1));
            }
            return results1;
          })());
        }
        return results;
      };
      // helper: make bruteforce match objects spanning i to j, inclusive.
      make_bruteforce_match = (i, j) => {
        return {
          pattern: 'bruteforce',
          token: password.slice(i, +j + 1 || 9e9),
          i: i,
          j: j
        };
      };
      // helper: step backwards through optimal.m starting at the end,
      // constructing the final optimal match sequence.
      unwind = (n) => {
        var candidate_g, candidate_l, g, k, l, optimal_match_sequence, ref;
        optimal_match_sequence = [];
        k = n - 1;
        // find the final best sequence length and score
        l = void 0;
        g = 2e308;
        ref = optimal.g[k];
        for (candidate_l in ref) {
          candidate_g = ref[candidate_l];
          if (candidate_g < g) {
            l = candidate_l;
            g = candidate_g;
          }
        }
        while (k >= 0) {
          m = optimal.m[k][l];
          optimal_match_sequence.unshift(m);
          k = m.i - 1;
          l--;
        }
        return optimal_match_sequence;
      };
      for (k = u = 0, ref = n; (0 <= ref ? u < ref : u > ref); k = 0 <= ref ? ++u : --u) {
        ref1 = matches_by_j[k];
        for (w = 0, len2 = ref1.length; w < len2; w++) {
          m = ref1[w];
          if (m.i > 0) {
            for (l in optimal.m[m.i - 1]) {
              l = parseInt(l);
              update(m, l + 1);
            }
          } else {
            update(m, 1);
          }
        }
        bruteforce_update(k);
      }
      optimal_match_sequence = unwind(n);
      optimal_l = optimal_match_sequence.length;
      // corner: empty password
      if (password.length === 0) {
        guesses = 1;
      } else {
        guesses = optimal.g[n - 1][optimal_l];
      }
      return {
        // final result object
        password: password,
        guesses: guesses,
        guesses_log10: this.log10(guesses),
        sequence: optimal_match_sequence
      };
    },
    // ------------------------------------------------------------------------------
    // guess estimation -- one function per match pattern ---------------------------
    // ------------------------------------------------------------------------------
    estimate_guesses: function(match, password) {
      var estimation_functions, guesses, min_guesses;
      if (match.guesses != null) {
        return match.guesses; // a match's guess estimate doesn't change. cache it.
      }
      min_guesses = 1;
      if (match.token.length < password.length) {
        min_guesses = match.token.length === 1 ? MIN_SUBMATCH_GUESSES_SINGLE_CHAR : MIN_SUBMATCH_GUESSES_MULTI_CHAR;
      }
      estimation_functions = {
        bruteforce: this.bruteforce_guesses,
        dictionary: this.dictionary_guesses,
        spatial: this.spatial_guesses,
        repeat: this.repeat_guesses,
        sequence: this.sequence_guesses,
        regex: this.regex_guesses,
        date: this.date_guesses
      };
      guesses = estimation_functions[match.pattern].call(this, match);
      match.guesses = Math.max(guesses, min_guesses);
      match.guesses_log10 = this.log10(match.guesses);
      return match.guesses;
    },
    bruteforce_guesses: function(match) {
      var guesses, min_guesses;
      guesses = Math.pow(BRUTEFORCE_CARDINALITY, match.token.length);
      if (guesses === Number.POSITIVE_INFINITY) {
        guesses = Number.MAX_VALUE;
      }
      min_guesses = match.token.length === 1 ? MIN_SUBMATCH_GUESSES_SINGLE_CHAR + 1 : MIN_SUBMATCH_GUESSES_MULTI_CHAR + 1;
      return Math.max(guesses, min_guesses);
    },
    repeat_guesses: function(match) {
      return match.base_guesses * match.repeat_count;
    },
    sequence_guesses: function(match) {
      var base_guesses, first_chr;
      first_chr = match.token.charAt(0);
      // lower guesses for obvious starting points
      if (first_chr === 'a' || first_chr === 'A' || first_chr === 'z' || first_chr === 'Z' || first_chr === '0' || first_chr === '1' || first_chr === '9') {
        base_guesses = 4;
      } else {
        if (first_chr.match(/\d/)) {
          base_guesses = 10; // digits
        } else {
          // could give a higher base for uppercase,
          // assigning 26 to both upper and lower sequences is more conservative.
          base_guesses = 26;
        }
      }
      if (!match.ascending) {
        // need to try a descending sequence in addition to every ascending sequence ->
        // 2x guesses
        base_guesses *= 2;
      }
      return base_guesses * match.token.length;
    },
    MIN_YEAR_SPACE: 20,
    REFERENCE_YEAR: new Date().getFullYear(),
    regex_guesses: function(match) {
      var char_class_bases, year_space;
      char_class_bases = {
        alpha_lower: 26,
        alpha_upper: 26,
        alpha: 52,
        alphanumeric: 62,
        digits: 10,
        symbols: 33
      };
      if (match.regex_name in char_class_bases) {
        return Math.pow(char_class_bases[match.regex_name], match.token.length);
      } else {
        switch (match.regex_name) {
          case 'recent_year':
            // conservative estimate of year space: num years from REFERENCE_YEAR.
            // if year is close to REFERENCE_YEAR, estimate a year space of MIN_YEAR_SPACE.
            year_space = Math.abs(parseInt(match.regex_match[0]) - this.REFERENCE_YEAR);
            year_space = Math.max(year_space, this.MIN_YEAR_SPACE);
            return year_space;
        }
      }
    },
    date_guesses: function(match) {
      var guesses, year_space;
      // base guesses: (year distance from REFERENCE_YEAR) * num_days * num_years
      year_space = Math.max(Math.abs(match.year - this.REFERENCE_YEAR), this.MIN_YEAR_SPACE);
      guesses = year_space * 365;
      if (match.separator) {
        // add factor of 4 for separator selection (one of ~4 choices)
        guesses *= 4;
      }
      return guesses;
    },
    KEYBOARD_AVERAGE_DEGREE: calc_average_degree(adjacency_graphs.qwerty),
    // slightly different for keypad/mac keypad, but close enough
    KEYPAD_AVERAGE_DEGREE: calc_average_degree(adjacency_graphs.keypad),
    KEYBOARD_STARTING_POSITIONS: ((function() {
      var ref, results;
      ref = adjacency_graphs.qwerty;
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push(k);
      }
      return results;
    })()).length,
    KEYPAD_STARTING_POSITIONS: ((function() {
      var ref, results;
      ref = adjacency_graphs.keypad;
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push(k);
      }
      return results;
    })()).length,
    spatial_guesses: function(match) {
      var L, S, U, d, guesses, i, j, o, possible_turns, q, ref, ref1, ref2, ref3, s, shifted_variations, t, u;
      if ((ref = match.graph) === 'qwerty' || ref === 'dvorak') {
        s = this.KEYBOARD_STARTING_POSITIONS;
        d = this.KEYBOARD_AVERAGE_DEGREE;
      } else {
        s = this.KEYPAD_STARTING_POSITIONS;
        d = this.KEYPAD_AVERAGE_DEGREE;
      }
      guesses = 0;
      L = match.token.length;
      t = match.turns;
  // estimate the number of possible patterns w/ length L or less with t turns or less.
      for (i = o = 2, ref1 = L; (2 <= ref1 ? o <= ref1 : o >= ref1); i = 2 <= ref1 ? ++o : --o) {
        possible_turns = Math.min(t, i - 1);
        for (j = q = 1, ref2 = possible_turns; (1 <= ref2 ? q <= ref2 : q >= ref2); j = 1 <= ref2 ? ++q : --q) {
          guesses += this.nCk(i - 1, j - 1) * s * Math.pow(d, j);
        }
      }
      // add extra guesses for shifted keys. (% instead of 5, A instead of a.)
      // math is similar to extra guesses of l33t substitutions in dictionary matches.
      if (match.shifted_count) {
        S = match.shifted_count;
        U = match.token.length - match.shifted_count; // unshifted count
        if (S === 0 || U === 0) {
          guesses *= 2;
        } else {
          shifted_variations = 0;
          for (i = u = 1, ref3 = Math.min(S, U); (1 <= ref3 ? u <= ref3 : u >= ref3); i = 1 <= ref3 ? ++u : --u) {
            shifted_variations += this.nCk(S + U, i);
          }
          guesses *= shifted_variations;
        }
      }
      return guesses;
    },
    dictionary_guesses: function(match) {
      var reversed_variations;
      match.base_guesses = match.rank; // keep these as properties for display purposes
      match.uppercase_variations = this.uppercase_variations(match);
      match.l33t_variations = this.l33t_variations(match);
      reversed_variations = match.reversed && 2 || 1;
      return match.base_guesses * match.uppercase_variations * match.l33t_variations * reversed_variations;
    },
    START_UPPER: /^[A-Z][^A-Z]+$/,
    END_UPPER: /^[^A-Z]+[A-Z]$/,
    ALL_UPPER: /^[^a-z]+$/,
    ALL_LOWER: /^[^A-Z]+$/,
    uppercase_variations: function(match) {
      var L, U, chr, i, len, o, q, ref, ref1, regex, variations, word;
      word = match.token;
      if (word.match(this.ALL_LOWER) || word.toLowerCase() === word) {
        return 1;
      }
      ref = [this.START_UPPER, this.END_UPPER, this.ALL_UPPER];
      // a capitalized word is the most common capitalization scheme,
      // so it only doubles the search space (uncapitalized + capitalized).
      // allcaps and end-capitalized are common enough too, underestimate as 2x factor to be safe.
      for (o = 0, len = ref.length; o < len; o++) {
        regex = ref[o];
        if (word.match(regex)) {
          return 2;
        }
      }
      // otherwise calculate the number of ways to capitalize U+L uppercase+lowercase letters
      // with U uppercase letters or less. or, if there's more uppercase than lower (for eg. PASSwORD),
      // the number of ways to lowercase U+L letters with L lowercase letters or less.
      U = ((function() {
        var len1, q, ref1, results;
        ref1 = word.split('');
        results = [];
        for (q = 0, len1 = ref1.length; q < len1; q++) {
          chr = ref1[q];
          if (chr.match(/[A-Z]/)) {
            results.push(chr);
          }
        }
        return results;
      })()).length;
      L = ((function() {
        var len1, q, ref1, results;
        ref1 = word.split('');
        results = [];
        for (q = 0, len1 = ref1.length; q < len1; q++) {
          chr = ref1[q];
          if (chr.match(/[a-z]/)) {
            results.push(chr);
          }
        }
        return results;
      })()).length;
      variations = 0;
      for (i = q = 1, ref1 = Math.min(U, L); (1 <= ref1 ? q <= ref1 : q >= ref1); i = 1 <= ref1 ? ++q : --q) {
        variations += this.nCk(U + L, i);
      }
      return variations;
    },
    l33t_variations: function(match) {
      var S, U, chr, chrs, i, o, p, possibilities, ref, ref1, subbed, unsubbed, variations;
      if (!match.l33t) {
        return 1;
      }
      variations = 1;
      ref = match.sub;
      for (subbed in ref) {
        unsubbed = ref[subbed];
        // lower-case match.token before calculating: capitalization shouldn't affect l33t calc.
        chrs = match.token.toLowerCase().split('');
        S = ((function() {
          var len, o, results;
          results = [];
          for (o = 0, len = chrs.length; o < len; o++) {
            chr = chrs[o];
            if (chr === subbed) {
              results.push(chr);
            }
          }
          return results;
        })()).length; // num of subbed chars
        U = ((function() {
          var len, o, results;
          results = [];
          for (o = 0, len = chrs.length; o < len; o++) {
            chr = chrs[o];
            if (chr === unsubbed) {
              results.push(chr);
            }
          }
          return results;
        })()).length; // num of unsubbed chars
        if (S === 0 || U === 0) {
          // for this sub, password is either fully subbed (444) or fully unsubbed (aaa)
          // treat that as doubling the space (attacker needs to try fully subbed chars in addition to
          // unsubbed.)
          variations *= 2;
        } else {
          // this case is similar to capitalization:
          // with aa44a, U = 3, S = 2, attacker needs to try unsubbed + one sub + two subs
          p = Math.min(U, S);
          possibilities = 0;
          for (i = o = 1, ref1 = p; (1 <= ref1 ? o <= ref1 : o >= ref1); i = 1 <= ref1 ? ++o : --o) {
            possibilities += this.nCk(U + S, i);
          }
          variations *= possibilities;
        }
      }
      return variations;
    }
  };

  // utilities --------------------------------------------------------------------
  return scoring;

});

  var feedback, scoring;
define('skylark-zxcvbn/feedback',[
  './scoring'
],function(scoring){


  feedback = {
    default_feedback: {
      warning: '',
      suggestions: ["Use a few words, avoid common phrases", "No need for symbols, digits, or uppercase letters"]
    },
    get_feedback: function(score, sequence) {
      var extra_feedback, i, len, longest_match, match, ref;
      if (sequence.length === 0) {
        // starting feedback
        return this.default_feedback;
      }
      // no feedback if score is good or great.
      if (score > 2) {
        return {
          warning: '',
          suggestions: []
        };
      }
      // tie feedback to the longest match for longer sequences
      longest_match = sequence[0];
      ref = sequence.slice(1);
      for (i = 0, len = ref.length; i < len; i++) {
        match = ref[i];
        if (match.token.length > longest_match.token.length) {
          longest_match = match;
        }
      }
      feedback = this.get_match_feedback(longest_match, sequence.length === 1);
      extra_feedback = 'Add another word or two. Uncommon words are better.';
      if (feedback != null) {
        feedback.suggestions.unshift(extra_feedback);
        if (feedback.warning == null) {
          feedback.warning = '';
        }
      } else {
        feedback = {
          warning: '',
          suggestions: [extra_feedback]
        };
      }
      return feedback;
    },
    get_match_feedback: function(match, is_sole_match) {
      var layout, warning;
      switch (match.pattern) {
        case 'dictionary':
          return this.get_dictionary_match_feedback(match, is_sole_match);
        case 'spatial':
          layout = match.graph.toUpperCase();
          warning = match.turns === 1 ? 'Straight rows of keys are easy to guess' : 'Short keyboard patterns are easy to guess';
          return {
            warning: warning,
            suggestions: ['Use a longer keyboard pattern with more turns']
          };
        case 'repeat':
          warning = match.base_token.length === 1 ? 'Repeats like "aaa" are easy to guess' : 'Repeats like "abcabcabc" are only slightly harder to guess than "abc"';
          return {
            warning: warning,
            suggestions: ['Avoid repeated words and characters']
          };
        case 'sequence':
          return {
            warning: "Sequences like abc or 6543 are easy to guess",
            suggestions: ['Avoid sequences']
          };
        case 'regex':
          if (match.regex_name === 'recent_year') {
            return {
              warning: "Recent years are easy to guess",
              suggestions: ['Avoid recent years', 'Avoid years that are associated with you']
            };
          }
          break;
        case 'date':
          return {
            warning: "Dates are often easy to guess",
            suggestions: ['Avoid dates and years that are associated with you']
          };
      }
    },
    get_dictionary_match_feedback: function(match, is_sole_match) {
      var ref, result, suggestions, warning, word;
      warning = match.dictionary_name === 'passwords' ? is_sole_match && !match.l33t && !match.reversed ? match.rank <= 10 ? 'This is a top-10 common password' : match.rank <= 100 ? 'This is a top-100 common password' : 'This is a very common password' : match.guesses_log10 <= 4 ? 'This is similar to a commonly used password' : void 0 : match.dictionary_name === 'english_wikipedia' ? is_sole_match ? 'A word by itself is easy to guess' : void 0 : (ref = match.dictionary_name) === 'surnames' || ref === 'male_names' || ref === 'female_names' ? is_sole_match ? 'Names and surnames by themselves are easy to guess' : 'Common names and surnames are easy to guess' : '';
      suggestions = [];
      word = match.token;
      if (word.match(scoring.START_UPPER)) {
        suggestions.push("Capitalization doesn't help very much");
      } else if (word.match(scoring.ALL_UPPER) && word.toLowerCase() !== word) {
        suggestions.push("All-uppercase is almost as easy to guess as all-lowercase");
      }
      if (match.reversed && match.token.length >= 4) {
        suggestions.push("Reversed words aren't much harder to guess");
      }
      if (match.l33t) {
        suggestions.push("Predictable substitutions like '@' instead of 'a' don't help very much");
      }
      result = {
        warning: warning,
        suggestions: suggestions
      };
      return result;
    }
  };

  return feedback;
});

  var feedback, matching, scoring, time, time_estimates, zxcvbn;

  matching = require('./matching');

define('skylark-zxcvbn/main',[
  './time_estimates',
  './feedback',
  './scoring'
],function(time_estimates,feedback,scoring){

  time = function() {
    return (new Date()).getTime();
  };

  zxcvbn = function(password, user_inputs = []) {
    var arg, attack_times, i, len, matches, prop, ref, result, sanitized_inputs, start, val;
    start = time();
    // reset the user inputs matcher on a per-request basis to keep things stateless
    sanitized_inputs = [];
    for (i = 0, len = user_inputs.length; i < len; i++) {
      arg = user_inputs[i];
      if ((ref = typeof arg) === "string" || ref === "number" || ref === "boolean") {
        sanitized_inputs.push(arg.toString().toLowerCase());
      }
    }
    matching.set_user_input_dictionary(sanitized_inputs);
    matches = matching.omnimatch(password);
    result = scoring.most_guessable_match_sequence(password, matches);
    result.calc_time = time() - start;
    attack_times = time_estimates.estimate_attack_times(result.guesses);
    for (prop in attack_times) {
      val = attack_times[prop];
      result[prop] = val;
    }
    result.feedback = feedback.get_feedback(result.score, result.sequence);
    return result;
  };

  return zxcvbn;
});
define('skylark-zxcvbn', ['skylark-zxcvbn/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-zxcvbn.js.map
