/**
 * skylark-zxcvbn - A version of zxcvbn.js that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-zxcvbn/
 * @license MIT
 */
var feedback,matching,scoring,time,time_estimates,zxcvbn;matching=require("./matching"),define(["./time_estimates","./feedback","./scoring"],function(e,t,i){return time=function(){return(new Date).getTime()},zxcvbn=function(n,c=[]){var a,m,s,r,o,u,g,_,f,b,h;for(b=time(),f=[],s=0,r=c.length;s<r;s++)"string"!=(g=typeof(a=c[s]))&&"number"!==g&&"boolean"!==g||f.push(a.toString().toLowerCase());for(u in matching.set_user_input_dictionary(f),o=matching.omnimatch(n),(_=i.most_guessable_match_sequence(n,o)).calc_time=time()-b,m=e.estimate_attack_times(_.guesses))h=m[u],_[u]=h;return _.feedback=t.get_feedback(_.score,_.sequence),_}});
//# sourceMappingURL=sourcemaps/main.js.map
