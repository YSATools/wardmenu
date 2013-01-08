/*jshint devel:true strict:true browser:true node:true jquery:true es5:true
onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true unused:true undef:true*/
var cache
  , Join = null
  , store = {}
  , emitter = {}
  , ludrsBase = 'https://www.lds.org/directory/services/ludrs'
  ;

(function () {
  "use strict";
  
  var $ = jQuery
    , ldsDirP
    ;

  // Poor Man's DB
  store.get = function (key) {
    if (!cache) {
      cache = {}; //JSON.parse(localStorage.getItem('cache') || "{}");
    }

    return cache[key];
  };
  store.set = function (key, val) {
    cache[key] = val;
    //return localStorage.setItem('cache', JSON.stringify(cache));
  };

  // Poor Man's Event Emitter
  function Emitter() {
    this.init();
  }
  Emitter.prototype.init = function () {
    emitter._listeners = {};
  };
  Emitter.prototype.on = function (event, fn) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(fn);
  };
  Emitter.prototype.emit = function () {
    var args = [].slice.call(arguments)
      , event = args.shift()
      ;

    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].forEach(function (fn) {
      fn.apply(null, args);
    });
  };

  // Poor Man's Join
  Join = {
    create: function () {
      var things = []
        , len = Infinity
        , fn
        , complete = 0
        ;

      return {
          when: function (_fn) {
            fn = _fn;
            len = things.length;
            if (complete === len) {
              fn.apply(null, things);
            }
          }
        , add: function () {
            var i = things.length
              ;
              
            things[things.length] = null;

            return function () {
              var args = [].slice.call(arguments)
                ;

              complete += 1;
              things[i] = args;
              if (fn && (complete === len)) {
                fn.apply(null, things);
              }
            };
          }
      };
    }
  };

  // Poor Man's forEachAsync
  function forEachAsync(arr, fn) {
    var gfn
      , index = -1
      ;

    function next() {
      if (0 === arr.length) {
        gfn();
        return;
      }

      index += 1;
      fn(next, arr.shift(), index, arr);
    }

    setTimeout(next, 4);

    return {
      then: function (_fn) {
        gfn = _fn;
      }
    };
  }

  function LdsDir() {
  }
  ldsDirP = LdsDir.prototype;
  ldsDirP.init = function (fns) {
    var me = this
      ;

    me.areas = null;
    me.homeArea = null;
    me.homeAreaId = null;

    me.stakes = null;
    me.homeStake = null;
    me.homeStakeId = null;

    me.wards = null;
    me.homeWard = null;
    me.homeWardId = null;

    me._listeners = fns || {};
  };
  ldsDirP.getHousehold = function (fn, id) {
    var me = this
      , profileId = 'profile-' + id
      , profile = store.get(profileId)
      ;

    function onResult() {
      store.set(profileId, profile);
      if (me._listeners.profile) {
        me._listeners.profile(profile);
      }
      fn(profile);
    }

    if (profile) {
      onResult(profile);
      return;
    }

    $.getJSON(ludrsBase + '/mem/householdProfile/' + id, function (_profile) {
      profile = _profile;
      onResult();
    });
  };

  ldsDirP.getHouseholds = function (fn, profileIds) {
    var me = this
      , membersInfo = []
      ;

    function gotOneHousehold(next, memberId) {
      me.getHousehold(function (household) {
        membersInfo.push(household);
        next();
      }, memberId);
    }

    forEachAsync(profileIds, gotOneHousehold).then(function () {
      console.log(membersInfo);
      fn(membersInfo);
    });
  };

  ldsDirP.getWard = function (fn, wardUnitNo) {
    var me = this
      , join = Join.create()
      , memberListId = 'member-list-' + wardUnitNo
      , fullMemberList = store.get(memberListId)
      ;

    function onWardResult() {
      if (me._listeners.memberList) {
        me._listeners.memberList(fullMemberList);
      }

      fn(fullMemberList);
    }
    if (fullMemberList) {
      onWardResult();
      return;
    }
    
    $.getJSON(ludrsBase + '/mem/member-list/' + wardUnitNo, join.add());
    // https://www.lds.org/directory/services/ludrs/mem/wardDirectory/photos/228079
    $.getJSON(ludrsBase + '/mem/wardDirectory/photos/' + wardUnitNo, join.add());

    join.when(function (memberListArgs, photoListArgs) {
      var memberList = memberListArgs[0]
        , photoList = photoListArgs[0]
        ;

      photoList.forEach(function (photo) {
        memberList.forEach(function (member) {
          if (photo.householdId !== member.headOfHouseIndividualId) {
            return;
          }

          member.householdId = photo.householdId;
          member.householdName = photo.householdName;
          member.phoneNumber = photo.phoneNumber;
          member.photoUrl = member.photoUrl || photo.photoUrl;
        });
      });

      fullMemberList = memberList;
      store.set('member-list-' + wardUnitNo, fullMemberList);
      // don't store photo list
      onWardResult();
    });
  };
  ldsDirP.getWards = function (fn, wardUnitNos) {
    var me = this
      , profileIds = []
      ;

    function pushMemberIds(next, wardUnitNo) {
      me.getWard(function (members) {
        members.forEach(function (m) {
          profileIds.push(m.headOfHouseIndividualId);
        });
        next();
      }, wardUnitNo);
    }

    forEachAsync(wardUnitNos, pushMemberIds).then(function () {
      me.getHouseholds(fn, profileIds);
    });
  };

  ldsDirP.getStakeInfo = function (fn) {
    var me = this
      , areaInfoId = 'area-info'
      , areaInfo = store.get(areaInfoId)
      , stakesInfoId = 'stakes-info'
      , stakesInfo = store.get(stakesInfoId)
      ;

    function onResult() {
      me.homeArea = areaInfo;
      me.homeAreaId = areaInfo.areaUnitNo;
      me.homeStakeId = areaInfo.stakeUnitNo;
      me.homeWardId = areaInfo.wardUnitNo;

      me.stakes = stakesInfo;
      me.homeStake = me.stakes[0];
      me.wards = me.homeStake.wards;
      console.log('onResult getStakeInfo');
      console.log(JSON.stringify(me, null, '  '));
      fn();
    }

    if (areaInfo && stakesInfo) {
      onResult();
      return;
    }

    $.getJSON(ludrsBase + '/unit/current-user-ward-stake/', function (_areaInfo) {

      areaInfo = _areaInfo;
      store.set(areaInfoId, _areaInfo);

      $.getJSON(ludrsBase + '/unit/current-user-units/', function (_stakesInfo) {

        stakesInfo = _stakesInfo;
        store.set(stakesInfoId, stakesInfo);
        onResult();
      });
    });
  };
  ldsDirP.getCurrentStakeProfiles = function (fn) {
    var me = this
      ;

    function onStakeInfo() {
      var wards = me.wards
        , wardUnitNos = []
        ;

      if (!$('#js-counter').length) {
        $('body').prepend(
          '<div style="'
            + 'z-index: 100000; position:fixed;'
            + 'top:40%; width:200px; height:50px;'
            + 'right: 50%; background-color:black;'
          + '" id="js-counter">0</div>'
        );
      }

      // TODO use underscore.pluck
      wards.forEach(function (w) {
        wardUnitNos.push(w.wardUnitNo);
      });

      me.getWards(fn, me.homeStake.wards);
    }

    me.getStakeInfo(onStakeInfo);
  };
  ldsDirP.getCurrentWardProfiles = function (fn) {
    var me = this
      ;

    me.getStakeInfo(function () {
      me.getWards(function (households) {
        fn(households);
      }, [me.homeWardId]);
    });
  };
  LdsDir.create = function () {
    return Object.create(LdsDir.prototype);
  };

  module.exports = LdsDir;
}());
