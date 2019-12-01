define([
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
