/**
 * skylark-zxcvbn - A version of zxcvbn.js that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-zxcvbn/
 * @license MIT
 */
define(["./time_estimates","./feedback","./scoring","./matching"],function(e,t,n,i){var s;return s=function(){return(new Date).getTime()},function(a,r=[]){var c,o,u,m,_,f,g,b,d,h,k;for(h=s(),d=[],u=0,m=r.length;u<m;u++)"string"!=(g=typeof(c=r[u]))&&"number"!==g&&"boolean"!==g||d.push(c.toString().toLowerCase());for(f in i.set_user_input_dictionary(d),_=i.omnimatch(a),(b=n.most_guessable_match_sequence(a,_)).calc_time=s()-h,o=e.estimate_attack_times(b.guesses))k=o[f],b[f]=k;return b.feedback=t.get_feedback(b.score,b.sequence),b}});
//# sourceMappingURL=sourcemaps/main.js.map
