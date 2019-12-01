define([
  './adjacency_graphs',
  './frequency_lists',
  './scoring'
],function(adjacency_graphs,frequency_lists,scoring){
  var DATE_MAX_YEAR, DATE_MIN_YEAR, DATE_SPLITS, GRAPHS, L33T_TABLE, RANKED_DICTIONARIES, REGEXEN, adjacency_graphs, build_ranked_dict, frequency_lists, lst, matching, name, scoring;

  build_ranked_dict = function(ordered_list) {
    var i, len1, o, result, word;
    result = {};
    i = 1; // rank starts at 1, not 0
    for (o = 0, len1 = ordered_list.length; o < len1; o++) {
      word = ordered_list[o];
      result[word] = i;
      i += 1;
    }
    return result;
  };

  RANKED_DICTIONARIES = {};

  for (name in frequency_lists) {
    lst = frequency_lists[name];
    RANKED_DICTIONARIES[name] = build_ranked_dict(lst);
  }

  GRAPHS = {
    qwerty: adjacency_graphs.qwerty,
    dvorak: adjacency_graphs.dvorak,
    keypad: adjacency_graphs.keypad,
    mac_keypad: adjacency_graphs.mac_keypad
  };

  L33T_TABLE = {
    a: ['4', '@'],
    b: ['8'],
    c: ['(', '{', '[', '<'],
    e: ['3'],
    g: ['6', '9'],
    i: ['1', '!', '|'],
    l: ['1', '|', '7'],
    o: ['0'],
    s: ['$', '5'],
    t: ['+', '7'],
    x: ['%'],
    z: ['2']
  };

  REGEXEN = {
    recent_year: /19\d\d|200\d|201\d/g
  };

  DATE_MAX_YEAR = 2050;

  DATE_MIN_YEAR = 1000;

  DATE_SPLITS = {
    4: [
      [
        1,
        2 // 1 1 91 (2nd split starts at index 1, 3rd at index 2)
      ],
      [
        2,
        3 // 91 1 1
      ]
    ],
    5: [
      [
        1,
        3 // 1 11 91
      ],
      [
        2,
        3 // 11 1 91
      ]
    ],
    6: [
      [
        1,
        2 // 1 1 1991
      ],
      [
        2,
        4 // 11 11 91
      ],
      [
        4,
        5 // 1991 1 1
      ]
    ],
    7: [
      [
        1,
        3 // 1 11 1991
      ],
      [
        2,
        3 // 11 1 1991
      ],
      [
        4,
        5 // 1991 1 11
      ],
      [
        4,
        6 // 1991 11 1
      ]
    ],
    8: [
      [
        2,
        4 // 11 11 1991
      ],
      [
        4,
        6 // 1991 11 11
      ]
    ]
  };

  matching = {
    empty: function(obj) {
      var k;
      return ((function() {
        var results;
        results = [];
        for (k in obj) {
          results.push(k);
        }
        return results;
      })()).length === 0;
    },
    extend: function(lst, lst2) {
      return lst.push.apply(lst, lst2);
    },
    translate: function(string, chr_map) {
      var chr;
      return ((function() {
        var len1, o, ref, results;
        ref = string.split('');
        results = [];
        for (o = 0, len1 = ref.length; o < len1; o++) {
          chr = ref[o];
          results.push(chr_map[chr] || chr);
        }
        return results;
      })()).join('');
    },
    mod: function(n, m) {
      return ((n % m) + m) % m; // mod impl that works for negative numbers
    },
    sorted: function(matches) {
      // sort on i primary, j secondary
      return matches.sort(function(m1, m2) {
        return (m1.i - m2.i) || (m1.j - m2.j);
      });
    },
    // ------------------------------------------------------------------------------
    // omnimatch -- combine everything ----------------------------------------------
    // ------------------------------------------------------------------------------
    omnimatch: function(password) {
      var len1, matcher, matchers, matches, o;
      matches = [];
      matchers = [this.dictionary_match, this.reverse_dictionary_match, this.l33t_match, this.spatial_match, this.repeat_match, this.sequence_match, this.regex_match, this.date_match];
      for (o = 0, len1 = matchers.length; o < len1; o++) {
        matcher = matchers[o];
        this.extend(matches, matcher.call(this, password));
      }
      return this.sorted(matches);
    },
    //-------------------------------------------------------------------------------
    // dictionary match (common passwords, english, last names, etc) ----------------
    //-------------------------------------------------------------------------------
    dictionary_match: function(password, _ranked_dictionaries = RANKED_DICTIONARIES) {
      var dictionary_name, i, j, len, matches, o, p, password_lower, rank, ranked_dict, ref, ref1, ref2, word;
      // _ranked_dictionaries variable is for unit testing purposes
      matches = [];
      len = password.length;
      password_lower = password.toLowerCase();
      for (dictionary_name in _ranked_dictionaries) {
        ranked_dict = _ranked_dictionaries[dictionary_name];
        for (i = o = 0, ref = len; (0 <= ref ? o < ref : o > ref); i = 0 <= ref ? ++o : --o) {
          for (j = p = ref1 = i, ref2 = len; (ref1 <= ref2 ? p < ref2 : p > ref2); j = ref1 <= ref2 ? ++p : --p) {
            if (password_lower.slice(i, +j + 1 || 9e9) in ranked_dict) {
              word = password_lower.slice(i, +j + 1 || 9e9);
              rank = ranked_dict[word];
              matches.push({
                pattern: 'dictionary',
                i: i,
                j: j,
                token: password.slice(i, +j + 1 || 9e9),
                matched_word: word,
                rank: rank,
                dictionary_name: dictionary_name,
                reversed: false,
                l33t: false
              });
            }
          }
        }
      }
      return this.sorted(matches);
    },
    reverse_dictionary_match: function(password, _ranked_dictionaries = RANKED_DICTIONARIES) {
      var len1, match, matches, o, reversed_password;
      reversed_password = password.split('').reverse().join('');
      matches = this.dictionary_match(reversed_password, _ranked_dictionaries);
      for (o = 0, len1 = matches.length; o < len1; o++) {
        match = matches[o];
        match.token = match.token.split('').reverse().join(''); // reverse back
        match.reversed = true;
        // map coordinates back to original string
        [match.i, match.j] = [password.length - 1 - match.j, password.length - 1 - match.i];
      }
      return this.sorted(matches);
    },
    set_user_input_dictionary: function(ordered_list) {
      return RANKED_DICTIONARIES['user_inputs'] = build_ranked_dict(ordered_list.slice());
    },
    //-------------------------------------------------------------------------------
    // dictionary match with common l33t substitutions ------------------------------
    //-------------------------------------------------------------------------------

    // makes a pruned copy of l33t_table that only includes password's possible substitutions
    relevant_l33t_subtable: function(password, table) {
      var chr, len1, letter, o, password_chars, ref, relevant_subs, sub, subs, subtable;
      password_chars = {};
      ref = password.split('');
      for (o = 0, len1 = ref.length; o < len1; o++) {
        chr = ref[o];
        password_chars[chr] = true;
      }
      subtable = {};
      for (letter in table) {
        subs = table[letter];
        relevant_subs = (function() {
          var len2, p, results;
          results = [];
          for (p = 0, len2 = subs.length; p < len2; p++) {
            sub = subs[p];
            if (sub in password_chars) {
              results.push(sub);
            }
          }
          return results;
        })();
        if (relevant_subs.length > 0) {
          subtable[letter] = relevant_subs;
        }
      }
      return subtable;
    },
    // returns the list of possible 1337 replacement dictionaries for a given password
    enumerate_l33t_subs: function(table) {
      var chr, dedup, helper, k, keys, l33t_chr, len1, len2, o, p, sub, sub_dict, sub_dicts, subs;
      keys = (function() {
        var results;
        results = [];
        for (k in table) {
          results.push(k);
        }
        return results;
      })();
      subs = [[]];
      dedup = function(subs) {
        var assoc, deduped, label, len1, members, o, sub, v;
        deduped = [];
        members = {};
        for (o = 0, len1 = subs.length; o < len1; o++) {
          sub = subs[o];
          assoc = (function() {
            var len2, p, results;
            results = [];
            for (v = p = 0, len2 = sub.length; p < len2; v = ++p) {
              k = sub[v];
              results.push([k, v]);
            }
            return results;
          })();
          assoc.sort();
          label = ((function() {
            var len2, p, results;
            results = [];
            for (v = p = 0, len2 = assoc.length; p < len2; v = ++p) {
              k = assoc[v];
              results.push(k + ',' + v);
            }
            return results;
          })()).join('-');
          if (!(label in members)) {
            members[label] = true;
            deduped.push(sub);
          }
        }
        return deduped;
      };
      helper = function(keys) {
        var dup_l33t_index, first_key, i, l33t_chr, len1, len2, next_subs, o, p, q, ref, ref1, rest_keys, sub, sub_alternative, sub_extension;
        if (!keys.length) {
          return;
        }
        first_key = keys[0];
        rest_keys = keys.slice(1);
        next_subs = [];
        ref = table[first_key];
        for (o = 0, len1 = ref.length; o < len1; o++) {
          l33t_chr = ref[o];
          for (p = 0, len2 = subs.length; p < len2; p++) {
            sub = subs[p];
            dup_l33t_index = -1;
            for (i = q = 0, ref1 = sub.length; (0 <= ref1 ? q < ref1 : q > ref1); i = 0 <= ref1 ? ++q : --q) {
              if (sub[i][0] === l33t_chr) {
                dup_l33t_index = i;
                break;
              }
            }
            if (dup_l33t_index === -1) {
              sub_extension = sub.concat([[l33t_chr, first_key]]);
              next_subs.push(sub_extension);
            } else {
              sub_alternative = sub.slice(0);
              sub_alternative.splice(dup_l33t_index, 1);
              sub_alternative.push([l33t_chr, first_key]);
              next_subs.push(sub);
              next_subs.push(sub_alternative);
            }
          }
        }
        subs = dedup(next_subs);
        return helper(rest_keys);
      };
      helper(keys);
      sub_dicts = []; // convert from assoc lists to dicts
      for (o = 0, len1 = subs.length; o < len1; o++) {
        sub = subs[o];
        sub_dict = {};
        for (p = 0, len2 = sub.length; p < len2; p++) {
          [l33t_chr, chr] = sub[p];
          sub_dict[l33t_chr] = chr;
        }
        sub_dicts.push(sub_dict);
      }
      return sub_dicts;
    },
    l33t_match: function(password, _ranked_dictionaries = RANKED_DICTIONARIES, _l33t_table = L33T_TABLE) {
      var chr, k, len1, len2, match, match_sub, matches, o, p, ref, ref1, sub, subbed_chr, subbed_password, token, v;
      matches = [];
      ref = this.enumerate_l33t_subs(this.relevant_l33t_subtable(password, _l33t_table));
      for (o = 0, len1 = ref.length; o < len1; o++) {
        sub = ref[o];
        if (this.empty(sub)) { // corner case: password has no relevant subs.
          break;
        }
        subbed_password = this.translate(password, sub);
        ref1 = this.dictionary_match(subbed_password, _ranked_dictionaries);
        for (p = 0, len2 = ref1.length; p < len2; p++) {
          match = ref1[p];
          token = password.slice(match.i, +match.j + 1 || 9e9);
          if (token.toLowerCase() === match.matched_word) {
            continue; // only return the matches that contain an actual substitution
          }
          match_sub = {}; // subset of mappings in sub that are in use for this match
          for (subbed_chr in sub) {
            chr = sub[subbed_chr];
            if (token.indexOf(subbed_chr) !== -1) {
              match_sub[subbed_chr] = chr;
            }
          }
          match.l33t = true;
          match.token = token;
          match.sub = match_sub;
          match.sub_display = ((function() {
            var results;
            results = [];
            for (k in match_sub) {
              v = match_sub[k];
              results.push(`${k} -> ${v}`);
            }
            return results;
          })()).join(', ');
          matches.push(match);
        }
      }
      return this.sorted(matches.filter(function(match) {
        // filter single-character l33t matches to reduce noise.
        // otherwise '1' matches 'i', '4' matches 'a', both very common English words
        // with low dictionary rank.
        return match.token.length > 1;
      }));
    },
    // ------------------------------------------------------------------------------
    // spatial match (qwerty/dvorak/keypad) -----------------------------------------
    // ------------------------------------------------------------------------------
    spatial_match: function(password, _graphs = GRAPHS) {
      var graph, graph_name, matches;
      matches = [];
      for (graph_name in _graphs) {
        graph = _graphs[graph_name];
        this.extend(matches, this.spatial_match_helper(password, graph, graph_name));
      }
      return this.sorted(matches);
    },
    SHIFTED_RX: /[~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:"ZXCVBNM<>?]/,
    spatial_match_helper: function(password, graph, graph_name) {
      var adj, adjacents, cur_char, cur_direction, found, found_direction, i, j, last_direction, len1, matches, o, prev_char, shifted_count, turns;
      matches = [];
      i = 0;
      while (i < password.length - 1) {
        j = i + 1;
        last_direction = null;
        turns = 0;
        if ((graph_name === 'qwerty' || graph_name === 'dvorak') && this.SHIFTED_RX.exec(password.charAt(i))) {
          // initial character is shifted
          shifted_count = 1;
        } else {
          shifted_count = 0;
        }
        while (true) {
          prev_char = password.charAt(j - 1);
          found = false;
          found_direction = -1;
          cur_direction = -1;
          adjacents = graph[prev_char] || [];
          // consider growing pattern by one character if j hasn't gone over the edge.
          if (j < password.length) {
            cur_char = password.charAt(j);
            for (o = 0, len1 = adjacents.length; o < len1; o++) {
              adj = adjacents[o];
              cur_direction += 1;
              if (adj && adj.indexOf(cur_char) !== -1) {
                found = true;
                found_direction = cur_direction;
                if (adj.indexOf(cur_char) === 1) {
                  // index 1 in the adjacency means the key is shifted,
                  // 0 means unshifted: A vs a, % vs 5, etc.
                  // for example, 'q' is adjacent to the entry '2@'.
                  // @ is shifted w/ index 1, 2 is unshifted.
                  shifted_count += 1;
                }
                if (last_direction !== found_direction) {
                  // adding a turn is correct even in the initial case when last_direction is null:
                  // every spatial pattern starts with a turn.
                  turns += 1;
                  last_direction = found_direction;
                }
                break;
              }
            }
          }
          // if the current pattern continued, extend j and try to grow again
          if (found) {
            j += 1;
          } else {
            // otherwise push the pattern discovered so far, if any...
            if (j - i > 2) { // don't consider length 1 or 2 chains.
              matches.push({
                pattern: 'spatial',
                i: i,
                j: j - 1,
                token: password.slice(i, j),
                graph: graph_name,
                turns: turns,
                shifted_count: shifted_count
              });
            }
            // ...and then start a new search for the rest of the password.
            i = j;
            break;
          }
        }
      }
      return matches;
    },
    //-------------------------------------------------------------------------------
    // repeats (aaa, abcabcabc) and sequences (abcdef) ------------------------------
    //-------------------------------------------------------------------------------
    repeat_match: function(password) {
      var base_analysis, base_guesses, base_matches, base_token, greedy, greedy_match, i, j, lastIndex, lazy, lazy_anchored, lazy_match, match, matches;
      matches = [];
      greedy = /(.+)\1+/g;
      lazy = /(.+?)\1+/g;
      lazy_anchored = /^(.+?)\1+$/;
      lastIndex = 0;
      while (lastIndex < password.length) {
        greedy.lastIndex = lazy.lastIndex = lastIndex;
        greedy_match = greedy.exec(password);
        lazy_match = lazy.exec(password);
        if (greedy_match == null) {
          break;
        }
        if (greedy_match[0].length > lazy_match[0].length) {
          // greedy beats lazy for 'aabaab'
          //   greedy: [aabaab, aab]
          //   lazy:   [aa,     a]
          match = greedy_match;
          // greedy's repeated string might itself be repeated, eg.
          // aabaab in aabaabaabaab.
          // run an anchored lazy match on greedy's repeated string
          // to find the shortest repeated string
          base_token = lazy_anchored.exec(match[0])[1];
        } else {
          // lazy beats greedy for 'aaaaa'
          //   greedy: [aaaa,  aa]
          //   lazy:   [aaaaa, a]
          match = lazy_match;
          base_token = match[1];
        }
        [i, j] = [match.index, match.index + match[0].length - 1];
        // recursively match and score the base string
        base_analysis = scoring.most_guessable_match_sequence(base_token, this.omnimatch(base_token));
        base_matches = base_analysis.sequence;
        base_guesses = base_analysis.guesses;
        matches.push({
          pattern: 'repeat',
          i: i,
          j: j,
          token: match[0],
          base_token: base_token,
          base_guesses: base_guesses,
          base_matches: base_matches,
          repeat_count: match[0].length / base_token.length
        });
        lastIndex = j + 1;
      }
      return matches;
    },
    MAX_DELTA: 5,
    sequence_match: function(password) {
      var delta, i, j, k, last_delta, o, ref, result, update;
      // Identifies sequences by looking for repeated differences in unicode codepoint.
      // this allows skipping, such as 9753, and also matches some extended unicode sequences
      // such as Greek and Cyrillic alphabets.

      // for example, consider the input 'abcdb975zy'

      // password: a   b   c   d   b    9   7   5   z   y
      // index:    0   1   2   3   4    5   6   7   8   9
      // delta:      1   1   1  -2  -41  -2  -2  69   1

      // expected result:
      // [(i, j, delta), ...] = [(0, 3, 1), (5, 7, -2), (8, 9, 1)]
      if (password.length === 1) {
        return [];
      }
      update = (i, j, delta) => {
        var ref, sequence_name, sequence_space, token;
        if (j - i > 1 || Math.abs(delta) === 1) {
          if ((0 < (ref = Math.abs(delta)) && ref <= this.MAX_DELTA)) {
            token = password.slice(i, +j + 1 || 9e9);
            if (/^[a-z]+$/.test(token)) {
              sequence_name = 'lower';
              sequence_space = 26;
            } else if (/^[A-Z]+$/.test(token)) {
              sequence_name = 'upper';
              sequence_space = 26;
            } else if (/^\d+$/.test(token)) {
              sequence_name = 'digits';
              sequence_space = 10;
            } else {
              // conservatively stick with roman alphabet size.
              // (this could be improved)
              sequence_name = 'unicode';
              sequence_space = 26;
            }
            return result.push({
              pattern: 'sequence',
              i: i,
              j: j,
              token: password.slice(i, +j + 1 || 9e9),
              sequence_name: sequence_name,
              sequence_space: sequence_space,
              ascending: delta > 0
            });
          }
        }
      };
      result = [];
      i = 0;
      last_delta = null;
      for (k = o = 1, ref = password.length; (1 <= ref ? o < ref : o > ref); k = 1 <= ref ? ++o : --o) {
        delta = password.charCodeAt(k) - password.charCodeAt(k - 1);
        if (last_delta == null) {
          last_delta = delta;
        }
        if (delta === last_delta) {
          continue;
        }
        j = k - 1;
        update(i, j, last_delta);
        i = j;
        last_delta = delta;
      }
      update(i, password.length - 1, last_delta);
      return result;
    },
    //-------------------------------------------------------------------------------
    // regex matching ---------------------------------------------------------------
    //-------------------------------------------------------------------------------
    regex_match: function(password, _regexen = REGEXEN) {
      var matches, regex, rx_match, token;
      matches = [];
      for (name in _regexen) {
        regex = _regexen[name];
        regex.lastIndex = 0; // keeps regex_match stateless
        while (rx_match = regex.exec(password)) {
          token = rx_match[0];
          matches.push({
            pattern: 'regex',
            token: token,
            i: rx_match.index,
            j: rx_match.index + rx_match[0].length - 1,
            regex_name: name,
            regex_match: rx_match
          });
        }
      }
      return this.sorted(matches);
    },
    //-------------------------------------------------------------------------------
    // date matching ----------------------------------------------------------------
    //-------------------------------------------------------------------------------
    date_match: function(password) {
      var best_candidate, candidate, candidates, distance, dmy, i, j, k, l, len1, len2, matches, maybe_date_no_separator, maybe_date_with_separator, metric, min_distance, o, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, rx_match, s, t, token;
      // a "date" is recognized as:
      //   any 3-tuple that starts or ends with a 2- or 4-digit year,
      //   with 2 or 0 separator chars (1.1.91 or 1191),
      //   maybe zero-padded (01-01-91 vs 1-1-91),
      //   a month between 1 and 12,
      //   a day between 1 and 31.

      // note: this isn't true date parsing in that "feb 31st" is allowed,
      // this doesn't check for leap years, etc.

      // recipe:
      // start with regex to find maybe-dates, then attempt to map the integers
      // onto month-day-year to filter the maybe-dates into dates.
      // finally, remove matches that are substrings of other matches to reduce noise.

      // note: instead of using a lazy or greedy regex to find many dates over the full string,
      // this uses a ^...$ regex against every substring of the password -- less performant but leads
      // to every possible date match.
      matches = [];
      maybe_date_no_separator = /^\d{4,8}$/;
      maybe_date_with_separator = /^(\d{1,4})([\s\/\\_.-])(\d{1,2})\2(\d{1,4})$/; // day, month, year
      // separator
      // day, month
      // same separator
      // day, month, year
      // dates without separators are between length 4 '1191' and 8 '11111991'
      for (i = o = 0, ref = password.length - 4; (0 <= ref ? o <= ref : o >= ref); i = 0 <= ref ? ++o : --o) {
        for (j = p = ref1 = i + 3, ref2 = i + 7; (ref1 <= ref2 ? p <= ref2 : p >= ref2); j = ref1 <= ref2 ? ++p : --p) {
          if (j >= password.length) {
            break;
          }
          token = password.slice(i, +j + 1 || 9e9);
          if (!maybe_date_no_separator.exec(token)) {
            continue;
          }
          candidates = [];
          ref3 = DATE_SPLITS[token.length];
          for (q = 0, len1 = ref3.length; q < len1; q++) {
            [k, l] = ref3[q];
            dmy = this.map_ints_to_dmy([parseInt(token.slice(0, k)), parseInt(token.slice(k, l)), parseInt(token.slice(l))]);
            if (dmy != null) {
              candidates.push(dmy);
            }
          }
          if (!(candidates.length > 0)) {
            continue;
          }
          // at this point: different possible dmy mappings for the same i,j substring.
          // match the candidate date that likely takes the fewest guesses: a year closest to 2000.
          // (scoring.REFERENCE_YEAR).

          // ie, considering '111504', prefer 11-15-04 to 1-1-1504
          // (interpreting '04' as 2004)
          best_candidate = candidates[0];
          metric = function(candidate) {
            return Math.abs(candidate.year - scoring.REFERENCE_YEAR);
          };
          min_distance = metric(candidates[0]);
          ref4 = candidates.slice(1);
          for (r = 0, len2 = ref4.length; r < len2; r++) {
            candidate = ref4[r];
            distance = metric(candidate);
            if (distance < min_distance) {
              [best_candidate, min_distance] = [candidate, distance];
            }
          }
          matches.push({
            pattern: 'date',
            token: token,
            i: i,
            j: j,
            separator: '',
            year: best_candidate.year,
            month: best_candidate.month,
            day: best_candidate.day
          });
        }
      }
  // dates with separators are between length 6 '1/1/91' and 10 '11/11/1991'
      for (i = s = 0, ref5 = password.length - 6; (0 <= ref5 ? s <= ref5 : s >= ref5); i = 0 <= ref5 ? ++s : --s) {
        for (j = t = ref6 = i + 5, ref7 = i + 9; (ref6 <= ref7 ? t <= ref7 : t >= ref7); j = ref6 <= ref7 ? ++t : --t) {
          if (j >= password.length) {
            break;
          }
          token = password.slice(i, +j + 1 || 9e9);
          rx_match = maybe_date_with_separator.exec(token);
          if (rx_match == null) {
            continue;
          }
          dmy = this.map_ints_to_dmy([parseInt(rx_match[1]), parseInt(rx_match[3]), parseInt(rx_match[4])]);
          if (dmy == null) {
            continue;
          }
          matches.push({
            pattern: 'date',
            token: token,
            i: i,
            j: j,
            separator: rx_match[2],
            year: dmy.year,
            month: dmy.month,
            day: dmy.day
          });
        }
      }
      // matches now contains all valid date strings in a way that is tricky to capture
      // with regexes only. while thorough, it will contain some unintuitive noise:

      // '2015_06_04', in addition to matching 2015_06_04, will also contain
      // 5(!) other date matches: 15_06_04, 5_06_04, ..., even 2015 (matched as 5/1/2020)

      // to reduce noise, remove date matches that are strict substrings of others
      return this.sorted(matches.filter(function(match) {
        var is_submatch, len3, other_match, u;
        is_submatch = false;
        for (u = 0, len3 = matches.length; u < len3; u++) {
          other_match = matches[u];
          if (match === other_match) {
            continue;
          }
          if (other_match.i <= match.i && other_match.j >= match.j) {
            is_submatch = true;
            break;
          }
        }
        return !is_submatch;
      }));
    },
    map_ints_to_dmy: function(ints) {
      var dm, int, len1, len2, len3, o, over_12, over_31, p, possible_year_splits, q, rest, under_1, y;
      // given a 3-tuple, discard if:
      //   middle int is over 31 (for all dmy formats, years are never allowed in the middle)
      //   middle int is zero
      //   any int is over the max allowable year
      //   any int is over two digits but under the min allowable year
      //   2 ints are over 31, the max allowable day
      //   2 ints are zero
      //   all ints are over 12, the max allowable month
      if (ints[1] > 31 || ints[1] <= 0) {
        return;
      }
      over_12 = 0;
      over_31 = 0;
      under_1 = 0;
      for (o = 0, len1 = ints.length; o < len1; o++) {
        int = ints[o];
        if ((99 < int && int < DATE_MIN_YEAR) || int > DATE_MAX_YEAR) {
          return;
        }
        if (int > 31) {
          over_31 += 1;
        }
        if (int > 12) {
          over_12 += 1;
        }
        if (int <= 0) {
          under_1 += 1;
        }
      }
      if (over_31 >= 2 || over_12 === 3 || under_1 >= 2) {
        return;
      }
      // first look for a four digit year: yyyy + daymonth or daymonth + yyyy
      possible_year_splits = [[ints[2], ints.slice(0, 2)], [ints[0], ints.slice(1, 3)]];
      for (p = 0, len2 = possible_year_splits.length; p < len2; p++) {
        [y, rest] = possible_year_splits[p];
        if ((DATE_MIN_YEAR <= y && y <= DATE_MAX_YEAR)) {
          dm = this.map_ints_to_dm(rest);
          if (dm != null) {
            return {
              year: y,
              month: dm.month,
              day: dm.day
            };
          } else {
            return;
          }
        }
      }
  // given no four-digit year, two digit years are the most flexible int to match, so
  // try to parse a day-month out of ints[0..1] or ints[1..0]
  // for a candidate that includes a four-digit year,
  // when the remaining ints don't match to a day and month,
  // it is not a date.
      for (q = 0, len3 = possible_year_splits.length; q < len3; q++) {
        [y, rest] = possible_year_splits[q];
        dm = this.map_ints_to_dm(rest);
        if (dm != null) {
          y = this.two_to_four_digit_year(y);
          return {
            year: y,
            month: dm.month,
            day: dm.day
          };
        }
      }
    },
    map_ints_to_dm: function(ints) {
      var d, len1, m, o, ref;
      ref = [ints, ints.slice().reverse()];
      for (o = 0, len1 = ref.length; o < len1; o++) {
        [d, m] = ref[o];
        if ((1 <= d && d <= 31) && (1 <= m && m <= 12)) {
          return {
            day: d,
            month: m
          };
        }
      }
    },
    two_to_four_digit_year: function(year) {
      if (year > 99) {
        return year;
      } else if (year > 50) {
        // 87 -> 1987
        return year + 1900;
      } else {
        // 15 -> 2015
        return year + 2000;
      }
    }
  };

  return matching;
});