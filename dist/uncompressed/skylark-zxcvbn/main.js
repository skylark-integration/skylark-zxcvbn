  var feedback, matching, scoring, time, time_estimates, zxcvbn;

  matching = require('./matching');

define([
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