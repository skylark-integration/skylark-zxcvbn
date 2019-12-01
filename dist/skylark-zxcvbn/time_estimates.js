/**
 * skylark-zxcvbn - A version of zxcvbn.js that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-zxcvbn/
 * @license MIT
 */
define([],function(){return{estimate_attack_times:function(e){var n,t,o,s;for(o in n={},t={online_throttling_100_per_hour:e/(100/3600),online_no_throttling_10_per_second:e/10,offline_slow_hashing_1e4_per_second:e/1e4,offline_fast_hashing_1e10_per_second:e/1e10})s=t[o],n[o]=this.display_time(s);return{crack_times_seconds:t,crack_times_display:n,score:this.guesses_to_score(e)}},guesses_to_score:function(e){return 5,e<1005?0:e<1e6+5?1:e<1e8+5?2:e<1e10+5?3:4},display_time:function(e){var n,t,o,s;return 60,3600,86400,2678400,s=32140800,321408e4,[t,o]=e<1?[null,"less than a second"]:e<60?[n=Math.round(e),`${n} second`]:e<3600?[n=Math.round(e/60),`${n} minute`]:e<86400?[n=Math.round(e/3600),`${n} hour`]:e<2678400?[n=Math.round(e/86400),`${n} day`]:e<s?[n=Math.round(e/2678400),`${n} month`]:e<321408e4?[n=Math.round(e/s),`${n} year`]:[null,"centuries"],null!=t&&1!==t&&(o+="s"),o}}});
//# sourceMappingURL=sourcemaps/time_estimates.js.map
