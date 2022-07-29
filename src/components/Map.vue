<script setup lang="ts">
import { reactive, ref } from 'vue';

const props = defineProps(['map'])
console.log(props.map)
const map = props.map
const moveMessage = ref('')
var prevMap = null
var stepResult = null

var selectedTile = null
const selectTile = reactive({
  active: false,
  x: 0,
  y: 0,
  tiles: ['YE', 'RE', 'GR', 'BL', 'BR', 'VI', 'SK', 'RS']
})
const animation = {
  fadeTime: 1000,
  pauseTime: 200
}
const emptyElem = 'EM'

function ballClicked(event) {
  if (event.currentTarget.classList.contains('un')) {
    selectTile.active = true
    selectTile.x = event.currentTarget.getAttribute("x-coord")
    selectTile.y = event.currentTarget.getAttribute("y-coord")
  } else {
    if (selectedTile == null) {
        selectedTile = event.currentTarget
        selectedTile.classList.add('selected')
    } else {
        selectedTile.classList.remove('selected')
        let res = changeTiles({x: selectedTile.getAttribute("x-coord"), y: selectedTile.getAttribute("y-coord")},
            {x: event.currentTarget.getAttribute("x-coord"), y: event.currentTarget.getAttribute("y-coord")})
        moveMessage.value = res.message
        selectedTile = null
    }
  }
}

function changeTiles(coord1, coord2) {
  function noUndefinedTiles() {
    for (var i in map) {
      for (var j in map[i]) {
        if (map[i][j] === 'UN') {
          return false;
        }
      }
    }
    return true;
  }

  function isMoveValid(coord1, coord2, val1, val2) {
    if ((Math.abs(coord1.x - coord2.x) > 1) || (Math.abs(coord1.y - coord2.y) > 1)) return false;
    if ((coord1.x - coord2.x === 0) && (coord1.y - coord2.y === 0)) return false;
    if ((Math.abs(coord1.x - coord2.x) === 1) && (Math.abs(coord1.y - coord2.y) !== 0)) return false;
    if ((Math.abs(coord1.y - coord2.y) === 1) && (Math.abs(coord1.x - coord2.x) !== 0)) return false;
    if (val1 === emptyElem || val2 === emptyElem) return false;
    return true;
  }

  if (!isMoveValid(coord1, coord2, map[coord1.x][coord1.y], map[coord2.x][coord2.y])) return {message: 'incorrect move: tile should be close to each other'}
  if (!noUndefinedTiles()) return {message: 'specify all undefined tiles!'}
  saveStateBeforeChange()
  stepResult = null
  let oldMap = cloneMap()
  map[coord1.x][coord1.y] = oldMap[coord2.x][coord2.y]
  map[coord2.x][coord2.y] = oldMap[coord1.x][coord1.y]
  let matchFound = executeSteps()
  if (!matchFound) {
      reloadMap(oldMap)
      return {message: 'no matches found'}
  }
  return {message: 'all good'}
}

function executeSteps(accResult = {hasMatch: false, hasAdditionalMove: false, removedCombinations: []}) {
  console.log("in execute steps")
  let removeResult = removeMatches(map)
  if (removeResult.hasMatch) {
      accResult.hasMatch = true
      accResult.hasAdditionalMove ||= removeResult.hasAdditionalMove
      accResult.removedCombinations.push(...removeResult.removedCombinations)
      setTimeout(() => {
                console.log("in second step")
                dropTiles(map)
                setTimeout(() => executeSteps(accResult), animation.pauseTime)
            }, animation.fadeTime)
      return true
  } else {
      stepResult = accResult
      return false
  }
}

function removeMatches(map) {
  console.log("remove from map")
  printMap(map)
  function changeMarkedTilesTo(map, marks, valueF) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (marks[i][j] !== 0) {
                map[i][j] = valueF(i, j)
            }
        }
    }
  }

  let res = {
      hasMatch: false,
      hasAdditionalMove: false,
      removedCombinations: []
  }

  var marks = []
  for (var i in map) {
      marks[i] = []
      for (var j in map[i]) {
          marks[i][j] = 0
      }
  }
  let horizMatch = removeMatchesInDirection(map, marks, 'horizontal', 1)
  let vertMatch = removeMatchesInDirection(map, marks, 'vertical', horizMatch.lastMark)
  res.hasMatch = horizMatch.hasMatch || vertMatch.hasMatch
  res.hasAdditionalMove = horizMatch.hasAdditionalMove || vertMatch.hasAdditionalMove
  printMap(marks)
  // res.removedCombinations = this.calculateCombinations(map, marks)
  changeMarkedTilesTo(map, marks, (i, j) => map[i][j] + ' fade');
  setTimeout(() => changeMarkedTilesTo(map, marks, (i, j) => emptyElem), animation.fadeTime);
  console.log("remove result", res)
  return res
}

function removeMatchesInDirection(map, marks, direction, markWith) {
  let res = {
      hasMatch: false,
      hasAdditionalMove: false,
      lastMark: markWith
  }
  var getElem, setElem;
  let safeSet = (map, i, j, val) => {
      if (i >= 0 && i < map.length && j >= 0 && j < map[i].length && map[i][j] !== val) {
          map[i][j] = val
          return true
      } else {
          return false
      }
  };
  if (direction === 'horizontal') {
      getElem = (a, i, j) => a[i][j];
      setElem = (a, i, j, val) => safeSet(a, i, j, val);
  } else {
      getElem = (a, i, j) => a[j][i];
      setElem = (a, i, j, val) => safeSet(a, j, i, val);
  }

  let markAndUpdateResult = function(matchTiles, i, j, map, marks, markWith, getElem, setElem) {
      let markRes = markMatchedTiles(matchTiles, i, j, map, marks, markWith, getElem, setElem)
      res.hasMatch ||= markRes.hasMatch
      res.hasAdditionalMove ||= markRes.hasAdditionalMove
      if (markRes.hasMatch && res.lastMark === markWith) res.lastMark++
  }

  for (let i = 0; i < map.length; i++) {
      var matchTiles = 1
      var markWith = res.lastMark
      for (let j = 1; j < map[i].length; j++) {
          if (matchingTiles(getElem(map, i, j-1), getElem(map, i, j)) && getElem(map, i, j-1) !== emptyElem) {
              if (getElem(marks, i, j) > 0) markWith = getElem(marks, i, j)
              if (getElem(marks, i, j-1) > 0) markWith = getElem(marks, i, j-1)
              matchTiles++;
          } else {
              markAndUpdateResult(matchTiles, i, j, map, marks, markWith, getElem, setElem)
              matchTiles = 1
          }
      }
      markAndUpdateResult(matchTiles, i, map[i].length, map, marks, markWith, getElem, setElem)
  }
  return res
}

function matchingTiles(t1: string, t2: string) {
  return t1 === t2 || t1 === 'sk' && t2 === 'ro' || t1 === 'ro' && t2 === 'sk'
}

function markMatchedTiles(matchTiles, i, j, map, marks, markWith, getElem, setElem) {
    if (matchTiles < 3) {
        return {
            hasMatch: false,
            hasAdditionalMove: false
        };
    } 
    var addMove = false
    let elem = getElem(map, i, j-1)
    var n = j-1
    while (n >= 0 && matchingTiles(getElem(map, i, n), elem)) {
        if (getElem(marks, i, n) > 0) addMove = true
        setElem(marks, i, n, markWith);
        if (getElem(map, i, n) === 'ro') {
            markRockSkull(map, marks, -1, i, n, setElem, getElem)
        }
        n--
    }
    return {
        hasMatch: true,
        hasAdditionalMove: matchTiles >= 4 || addMove
    };
}

function markRockSkull(map, marks, markWith, i, j, setElem, getElem) {
    let checkAndMark = (i, j) => {
        if (getElem(marks, i, j) !== 0) return
        if (getElem(map, i, j) === emptyElem) return
        if (setElem(marks, i, j, markWith) && getElem(map, i, j) === 'ro') {
            markRockSkull(map, marks, markWith, i, j, setElem, getElem);
        }
    }
    checkAndMark(i-1, j, markWith);
    checkAndMark(i+1, j, markWith);
    checkAndMark(i, j-1, markWith);
    checkAndMark(i, j+1, markWith);
    checkAndMark(i-1, j-1, markWith);
    checkAndMark(i-1, j+1, markWith);
    checkAndMark(i+1, j-1, markWith);
    checkAndMark(i+1, j+1, markWith);
}

function dropTiles(map) {
    for (let i = 1; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j] === emptyElem) {
                var n = i
                while (n > 0) {
                    map[n][j] = map[n-1][j]
                    map[n-1][j] = emptyElem
                    n--
                }
            }
        }
    }
}

function cloneMap() {
  const cloned = []
  for (var i in map) {
      cloned[i] = []
      for (var j in map[i]) {
          cloned[i][j] = map[i][j]
      }
  }
  return cloned
}

function saveStateBeforeChange() {
    prevMap = cloneMap()
}

function reloadMap(newMap: Array<Array<string>>) {
  var n = 0
  for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
          map[i][j] = newMap[n]
          n++
      }
  }
}

function printMap(map) {
  for (let i = 0; i < 8; i++) {
    var line = i + ': '
    for (let j = 0; j < 8; j++) {
        line += map[i][j] + ' '
    }
    console.log(line)
  }
}
</script>

<template>
  <div id="move-message">
    Message: {{ moveMessage }}
  </div>
  <div id="gow-grid" style="margin-top: 20px">
    <div v-for="(line, i) in map" class="no-margin">
        <input v-for="(el, j) in line" class="ball" :class="el" type="button" @click="ballClicked" :x-coord="i" :y-coord="j"/>
    </div>
  </div>
  <div id="tile-selection" v-if="selectTile.active">
    <input v-for="el in selectTile.tiles" class="tile" v-bind:class="el" v-bind:el="el" type="button" v-on:click="tileSelected"/>
  </div>
</template>

<style scoped>
  .no-margin {
      margin-bottom: -6px;
  }
  .ball {
      height: 50px;
      width: 50px;
  }
  .tile {
      height: 35px;
      width: 35px;
      margin-right: 5px;
  }
  .em {
      /*visibility: hidden;*/
      background-color: grey;
  }
  .fade {
      opacity: 0.5;
      /*visibility: hidden;*/
      /*opacity: 0;*/
      /*transition: visibility 0s 2s, opacity 2s linear;*/
  }
  .selected {
      border: 2px solid black;
  }
  .YE {
      background-image: url('data:image/jpeg;base64,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');
      background-size: 100%;
  }
  .RE {
      background-image: url('data:image/jpeg;base64,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');
      background-size: 100%;
  }
  .BL {
      background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBYRXhpZgAATU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAjaADAAQAAAABAAAAjQAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8IAEQgAjQCNAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAMCBAEFAAYHCAkKC//EAMMQAAEDAwIEAwQGBAcGBAgGcwECAAMRBBIhBTETIhAGQVEyFGFxIweBIJFCFaFSM7EkYjAWwXLRQ5I0ggjhU0AlYxc18JNzolBEsoPxJlQ2ZJR0wmDShKMYcOInRTdls1V1pJXDhfLTRnaA40dWZrQJChkaKCkqODk6SElKV1hZWmdoaWp3eHl6hoeIiYqQlpeYmZqgpaanqKmqsLW2t7i5usDExcbHyMnK0NTV1tfY2drg5OXm5+jp6vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAQIAAwQFBgcICQoL/8QAwxEAAgIBAwMDAgMFAgUCBASHAQACEQMQEiEEIDFBEwUwIjJRFEAGMyNhQhVxUjSBUCSRoUOxFgdiNVPw0SVgwUThcvEXgmM2cCZFVJInotIICQoYGRooKSo3ODk6RkdISUpVVldYWVpkZWZnaGlqc3R1dnd4eXqAg4SFhoeIiYqQk5SVlpeYmZqgo6SlpqeoqaqwsrO0tba3uLm6wMLDxMXGx8jJytDT1NXW19jZ2uDi4+Tl5ufo6ery8/T19vf4+fr/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/2gAMAwEAAhEDEQAAAanRqnQCjtBWPRlXp6Fxvzctutg58orpWi61jgDXn6rHDJhpttUTACESm/7OTOB7XziZFgrMs+bghkEtnc0j3qsfQ8jeXXMDosslXLtFcZfTnYumhuvzC4MSmQ4bK722o7VUbV93z5Y1jU5pxUP2h0rrBg84fQYvq+w68SHak15jYcSFLrtVhWnPJtSyPToXitTFbykuERq3n6y2NfYbZqiB65rfse2xVpKQpxnoUV2vS5fxI06LkGwBPRNs7yxeNMt3TtseVUbdOVpa85Y44KTsRWJtptHgm2VNRXtMzjhUHRA1OuboltYVeJd6J9Hl1vULVbbYgzHp1RiRQqY4p0pWJtA2zF/5nWkRZSqXyGnXk+gxOrkaOMmncssIrYqiAy4aloZxZ8PYtW3NomdiIbudVS7M00SzNz8dGPQTz2ZOgbVC0daTu+fdJds322r/2gAIAQEAAQUC+4dGZw8pVPlEvkh8kMIUHzJEtEqVfzMkoQ8FyGO2LTbJDESA8UvFLMKC1Wzlt2FLiaFhQ+7LJRwQVMcQT9+rpCuK4sVALQY1RrCx3lXgIImgBIdWnJavc9PdI2u2Wh1dXbLpJoobhCESKHLUk5Dsj6SSIa1dXV5aUcEqs0rd5Hi6urju1oEi82tLhOC3cGiYRQRurqzwlXCYqu2Tktzf4sDp2qzxnDSckydUw4JP3KuKMytICQ7xeMPcntJqm3PSjWTsD2q4ITKwKdtEiWTmrFSV28yBV17K4ZYKg+5k7WHmnh2JoLi45pq7KVMc8koINCqoZWGVVcvtQ6HsS4o+ZJihERID5yXdz5qq7axXOiTblhyc1B+4v2uE1e+3/vpZ2ST2mSQqKMyK56kDnLcxMqPuRpzM+i+8CsZPuV+4r2uyjQW4pHMnJEaqp7oOafvSHBHc9Sxp2WOWsajshZQpC0SDEujo8S1FETlkMiuyziLdPeROQScCNXTumWRL97W/e1tU8qnR0dGohISDIoCg7yx1aVGNoKVjB4ujo6Ojo6OSUJYBkKE4/eWh0KCi5IYljU6AvEPEPpDXOhLVMpbTHVoTT+YKatQeAdVJfNWHzVvVTCA0pYFPu//aAAgBAxEBPwHSWaMU9YH9Yx6sFjkEuzPmrwys+WOIl9ku1wjeLYZL40yGgz5LtTY8JNFlzyxJHhxk2wNhyllFplKkclr0drEOJyedJjjhosMVcpAHqiHqSgMHINJjlp3p5YFBYBkLSnl50p8MRaONMmO3keW220AyYQ29koCSen/IvsH80YPzREDxr//aAAgBAhEBPwHSGC/KMeMNQ/JOLGWeAx7MeMR5KUkB3BpMzjLkxgjfHTBCzeoZBgmIKBTlhtk4I1DUnSIoIo6dSOLcP4A05J7eGmMfzTKJ4YxrTqPwPTm41oY83qIjQPVS4pwT2ybT28DkuSe83phz+h1ppNDy5s27gdkcsoo6j839RFPU/kyySl51/9oACAEBAAY/Avu9Aq/R9Si/N+b0WXqMn6fzNOJfV+D0FHrq/ZD4B+yH7L6S9Q/VL0+9ini/Uv4/zFKdTyo6o+78S6nj9zFAqXVch+x6FX4uqDkO4r2NHkl1HfL7tAfwfm8FGvo9XzUj596PXtgeB7U9fvJTGnq7Z+Q7L+X3qhgv5ff/AJPq6Dh2x81ffI9Go/H71T7P8LoO1TweXl5Og1LqpB+6afeyV7P8Lp2qXRPs9qn007Kpwr91Q+4EsCmr17Yp4DtmVYh9Cwfm8ZMh8z95X3FH4PTUvXtXyL+DxQaB8XRX3SWFfc+f8yfn9z5/eqPv1+5j3r5fcqHpofQ/d6zr6Op+wfcyP3KH7uivxfspeiUv2qfL7tTw+9rwen81U/zFUuiw+P3OL0fS9f5zi+L9p6n+Y//EADMQAQADAAICAgICAwEBAAACCwERACExQVFhcYGRobHB8NEQ4fEgMEBQYHCAkKCwwNDg/9oACAEBAAE/If8A8CBLhS4j+L2mPovYH3fnX4l4cU6U83H5eH/8nAfDSTbSTge7rNV4r8V/+VV+fwXoh8ZfeemqTP8AJcD/AMrJn9eP/wAU/lf6qTOlDnmps2bNmzTVg9LfBR4sdn2WVnPZ4/8Awcb6LI8qaKjnuz/wfaY9FBpHxgsvCaO+DPNJ/wBnj/gHcZqeQN6z1Oq7KI8D/wAUCWyZcdUD4f8A4BKTQ8Lm+iPujlREqxNBDAsf7/8ABFksJs1GrlbIJZf0FbGF12Hq5/6LUWGieWP+E8Kg9/8ANzdVg+LNn/jmsMdV9+l4PV5qBs2bNxUvHfyokYH/ACHPh+rNmzYCf+AQaMnt/wAQOP8ArP8AwgTlgMEB1/yUvArqvQ+rFCpwFgdF4TWVf+SpCLqaf9SVODPVACHHj/gIkBW4I/ulEYSYJrNUCtLkUVDlpuNrf8I9I/8AFCyVj+3fipTA3QUfNR4VvXXN7s7th8ZLZbF8IplXqpv/AODavE8s0x/35k/tXXXsuqp/47h7ChMfNsDACL617tHDFiJOz/j/AMxqj32U/wCrycY//AMVf/4I58S/7s2G86spHPJfmD/soicm0R+7/wDHIv4Pf/4Mx+6IQdV4rn2V8H/fzZPN23ypUurLxZeKP1e+fHzeDJ+D/kf8xfc/9Pev1fVgM/4ixcZE8aoHLfmvQ/zSYWPp/wDgG4b9bFzj/wDAByrRqpRSq2//AIILzzSoOb0V8WN/+FLLwVnGPX/MXEbvST/pJzC5UFrUCCzJ00T/APkFQz5ryGXoO9a1+1DkaP3QaQyn/wCD/9oADAMBAAIRAxEAABA1vkTcRqrqMpzS6OibYwMxKLuGrUmMcjR34lT926oQCAnBJBt/wokNwfGYByVtjSgBLa7vAg6HXuCvO8L7/8QAMxEBAQEAAwABAgUFAQEAAQEJAQARITEQQVFhIHHwkYGhsdHB4fEwQFBgcICQoLDA0OD/2gAIAQMRAT8QtiOWJ1L+l211T+BTlT6ofZ+BtDcAcSJa79QqrHKOGrrYYInqyA1uUtG0du8HEg4fW6kcOWMs48M2wQuYTqyC7kOcTC6IzuHNyeb8+ox1azL6lgZaeGKWONjjYPBMGJlhDHmHTudMn3WPpMYwiHPj52xfL4AzlbE4Pf/aAAgBAhEBPxCBeCXnxL4XZXi8DmMVpyWZ4C9RnyWnuUxtLkX1ue7ObdFy82Fz7IHq5mXeEAy2vvYP3ssj6J22ll0N3amcqdQYHdpi7mxuI8QR/rj+2hifJXqB8XXjMXtum5HHXjfraWka2h8FsrwCxE0kGzYJBq4l+Me7dTG9JH4bPrdy9//aAAgBAQABPxCAMykd81Z5/wCLlPItcfJeCvJk8U3yu+VFMLJcKdXXcOhywUY/Bq0l8bH7o9nDV8Xuf+S+a/8AO7xC7h6+aAjJ4ZlNQ+WyjsgECgx8xC0Lj8C8qfpT+R5VEq/MP/KHD+AYqcl8TzQIjm9vlT/rSqHnT/jmhBVSrSSPY8FIQcRd918q+E0PiH/mPSx83GaEBGzZtrsDihiEPkp3M8/b/vdiQrkf7sAjLT7aZD3e/wDn0svnwHytGVHlj8liAOORL+6ggmuf1jGmWBEYTleGyr+cVSyBvzV6cjSPIU7/AKnX2IJzr1/xFgBLRPMWC+LxAzP3X/oRQt2A/KxDcOxzXaEka501zkpcuoWfqvlWJNKvEIyerF6jM02QzKyPsXho4irjQIPF8Yyw89/6OhyrsoEup7luOY4qSCKbyavDXlDKi+bo9Q/7ntXMfC1xgXI+KYWRKeGtGGQR7iaQDzfu8vj/AN0CXPdlYJ4x+BQmYAsTxSRKkDx2uSJ4z/vJ+mVZ155veRN2XyHw1yTOo+JuhHVJuENjWArTrH+f/FIgxA6/4kcWVern4DR+VCvEBStCwjKiKUKA43i9FdRKneiP1f3ZuD/jhOU0jfL0UFKiCHLz8UCMDDoH/A6ClViKNZ4fv/qjGERUD0ACH5+JsIG6zkWOMai5EwXicfm9sqSkg8Uab8WP4WktE3mp2ygHmn05sFYBEQgf+UZIaahH0VBVFl7VLwdfFOG1cxHqeLOGeiKTx1U0Q7iPx0llHLHixPO1IrZwuqM34X3tWG1ZZrEM+LngTzwf4CsQAx6VqSv1eI/qz9Oh0PhuZ5eNCKwLAIDird3yTYkiCloapIQkJ7sUVOqKUgQH8/8AlQ7QS/z7qIIcizVmlQRq33N78XmjtfhUkTXeb3SDremyLyQfEtStmjEld0aS/qwXR/IWKF6GbNm9iyEV1tiAdN+//wAL5vG+TXs+PihnuK190PZHXqiEYACKZQ9lAB56EnDyWL1SUSPLwLwgug/Hm94fqp9r5VXY4/NNUg0/kHV4FPBwLDZNFVSY4rhHw/FGL3XAJIsnuem6evZWPNlUrMQ9J1TQQ/wTYoG9Ev5sf7RJfzVngE/0u2Vlsoo2smBCiCQ8PNIeIvze71FYIn+rHrwJTab4v+QqFU6LP1F+NH4PxXW5zkrJR8Cnhh8eVLhh8eKVKWbIQlMsEPUWVBTyrhA8tyS9FsKVfdm7Kecuz+bRZfkVt5CtjZG78WURt7/5FOatWnFOZxsoMD2UzKv02Zu+aZEvJUBnT7ujEvdjJ/iiAXne7xRy/wD/2Q==');
      background-size: 100%;
  }
  .GR {
      background-image: url('data:image/jpeg;base64,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');
      background-size: 100%;
  }
  .BR {
      background-image: url('data:image/jpeg;base64,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');
      background-size: 100%;
  }
  .VI {
      background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBYRXhpZgAATU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAjaADAAQAAAABAAAAjQAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8IAEQgAjQCNAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAMCBAEFAAYHCAkKC//EAMMQAAEDAwIEAwQGBAcGBAgGcwECAAMRBBIhBTETIhAGQVEyFGFxIweBIJFCFaFSM7EkYjAWwXLRQ5I0ggjhU0AlYxc18JNzolBEsoPxJlQ2ZJR0wmDShKMYcOInRTdls1V1pJXDhfLTRnaA40dWZrQJChkaKCkqODk6SElKV1hZWmdoaWp3eHl6hoeIiYqQlpeYmZqgpaanqKmqsLW2t7i5usDExcbHyMnK0NTV1tfY2drg5OXm5+jp6vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAQIAAwQFBgcICQoL/8QAwxEAAgIBAwMDAgMFAgUCBASHAQACEQMQEiEEIDFBEwUwIjJRFEAGMyNhQhVxUjSBUCSRoUOxFgdiNVPw0SVgwUThcvEXgmM2cCZFVJInotIICQoYGRooKSo3ODk6RkdISUpVVldYWVpkZWZnaGlqc3R1dnd4eXqAg4SFhoeIiYqQk5SVlpeYmZqgo6SlpqeoqaqwsrO0tba3uLm6wMLDxMXGx8jJytDT1NXW19jZ2uDi4+Tl5ufo6ery8/T19vf4+fr/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/2gAMAwEAAhEDEQAAAafbVtm9HaidbatU2hOnao1xnanVaCRQOGrflws4QvLPbao2BSE6w7erETHb0LhMGJCMJcjknoagvccPL5G7teeySyyF8+MVx521cqGr0uxUjzAhmsi61xxnVcmDSi7mqJ5m0rRdGjhmRIZo/r3vm8TJ0zedHQrRurScnaKrJ1Kf1xlHTt5Y4lNW+Y7No0IUDIw48CvWT3Q6Ui0daR5kJkZws7V1G3bAh+gzYjcWG32OS2Tprz5OXAphtp3aM4CSjLIxG7200nZRaWltRJnETlWES648ls7OrzQu27937+gsWKkXCp6TXJo01kugCyynOsaUpDtWL3zeVQi5RUOVs+nVxlz6GojoinQEYFOVLSZWNBm2sfOxXMxjmrRNZs51VJHrXQlUxR0vZaszmzEyJmNJ3PKiS6FExMV//9oACAEBAAEFAvucGqYPKUvlvlB8oPBQYkkS0zJV/MySBLxVI0xMRvEOjoHiGY2uJhS42hYWPuyyUccTCaffD+gkt57KRAWkxqjWFjvKvAQoY0+5XtXvZrCZtFDcIkomUDGpJyHZP0kg+7FMqIwTomBgjkc+30aklCquO+kjTIsyKUHEcFu4NExig+8lRQq3uMk8wSO4jQtyJMau8waDkmTqmH8xZqotqU7jrT3Vwtz0o1k/mITSUq0Wp1atFdiycVQ/cJdfuRfvCpk9pOOjKg61cvtRcexNfvROrq6uc/ck9r2Za/fSK/cSHP7fdCczP0ydzEXiXiWEfcAqzSOM691cIBREyckRmo7W0oDXEyk/cSgqaYkxpuJuaruepXANY5a+8F0qNoMMzNq/dGm1AclxBC551THuo0ECe8icgk4H7iZZEv3qdqkWv7pNGn6RQFPuSoqwooIoXR0+7R0alhLAKyhNPvLQ8SkplYUk9qOnYrSGZFKaUNKafzCktSXg9Q+YoPNRdCWEhpSwPu//2gAIAQMRAT8B0jiJRgfZCcDLGR2Y8XqdLbbZnYWcOLGmKNnS9JRYyKaOk47S4RwnS0oCRSHMHH+F3Uk3pHyhkeHc5fDjlxpTSBWkjplLA0dLdzud2sjZ0hNvstlO+wSd7vd6Tr//2gAIAQIRAT8B0hhMmPTB/Thl0zPEY9mDD6lAptvTKTjNOTHxY0xRssfGhFs8Zj4ceWQ4KRGXlmOKckdsnAOGMtZchjFqmRc4cX4dBN3u60M/Gmbw4TxpSIoFaXaXOXHLaUC3kPuPuBsyapmaDI7jphzbeCjnw7XaNJSEfLlymZ7IZJQ8I6v839WPyZdWfRlKUvOv/9oACAEBAAY/AvuavpFX6B6qr30UXqKv0P8AM04l1X/Mah+qXUfexTxdTx/maAdbyx0dUv4/c+JdT/NJKn6hkB5JdR3y+9p+t6DX0eqA6xn7C6KFO2ILqrtgeB7U9f5jJPFhTodGUn8XifuVYL+X8zj69/j90j0aj8f5lPz/AJgs/wAyPuD7p/ma/cH3VD+dp6fcLSr7lRqHwfB6/dyLr9z5/dwXw9Xp97Jegensjh9wJHevl9yiupL6Va+h76vQ5K9A9eHp93I/cofu9K1D7X+8U+pRP2/e+H3teH83rw/mOl9T4/e6Xrr/ADntPi+L1Uf5j//EADMQAQADAAICAgICAwEBAAACCwERACExQVFhcYGRobHB8NEQ4fEgMEBQYHCAkKCwwNDg/9oACAEBAAE/If8A8CglAe6Jib+r5MniyeaingombuChWIX0P/5Oa+GipM6LEYUO2hdFh4K+Aq/VN4su0R2fBZA/X/X/AL5T/G7clF/xP/4J/wCAJxPB5qlU4Z+biPkf/g430X5RoBZs2f8AhY5ksPNmzeBgb66F41eb0G7KI8D/AMUCXgskXnLks/8AJs2SRTwLlwPKLlpfMXqqjacojS8VHuuGlaCJZ/0Hz/yMHK/5h/8AhmjEgUjXe7JH+VzRJwL+GvuzZrcA8l9ulWfVcP8As2bNmzZ1OVxYGx9Diz/0yiwp7X7Apx/+CbNn/wDAMt6yokPv/vCrA7vZ7/8AwCXdn/k1z62blzZH/na7Ko5Si4q/+DA+/wDihU//AAJs3P8AGro6etm//Dg+UuSrP/4lfqhAB/2Vq2PT/wDBOeqPAuP/AEid4sc1Kj3s9eV9UIIP+uqFfWeWpSuX/qhtjX5WSOzS/Kn/AHyS48LDuim5sf8AAr3FmGBzNfrcD/8AAfyqhAeKleEappJ/3I/W9UXI+A2Tiim6cQ90GCsz/J4PB/2KVt+x/wCi01ejsTY/6PAngrCP3X9x3/UWKRlpdaif/gEcWIapcL/0ixYsUr2pHuyakXj/AI/9bKYVmF9WHCz5vA1nX/SA5vezeARXWdKf/TZ//ADQqOlL41/3dKAL380GkGf/AIf/2gAMAwEAAhEDEQAAEP8A/JP/AIcVd7AldZYQ5ZMavKB8nIZkJciFdHEM7r8gLEaLb9gKlFEnb/gjZN2RZ8ttI83CcYaVZRbyEanHX//EADMRAQEBAAMAAQIFBQEBAAEBCQEAESExEEFRYSBx8JGBobHRweHxMEBQYHCAkKCwwNDg/9oACAEDEQE/EPObi+fI80/DJQYdTiz9fHCdj6rn34lx48OPEhyR+Gw8wCZbpAbudvhbOvN8aHEXDLh4JMYLMEPKUy03RnmFDYxLfFFwB4mbGINmY82ga3JeYcNhjzZGTcT0kImJ+iVbrz//2gAIAQIRAT8Q876Ec+Y9kl+DWgGE4s/Xz52G4Hzec6/Fk8AMZjXMSLo2EE1CA3fE+nSVeYjVtAbqtyQ7gMdBAL4JMui3zBtuRhF1OkLlC/JYgMnMdQDhkr+HAELLOq+P9DMOxD2QXwWRuqwB1de9smDhccT1yU1WWX//2gAIAQEAAT8QnbzYsTXgVyqIqxnBPFKd9Rq2Vvcv92Xo1BZJ4dsEJOD/ABow+5kP5oaZfD+byTkWPFZLK35L3/0dhTjx+aIkSx4KMEBRhI+urwf4qDx+CoNb6q8pPi8h+lrhlx2cRRxAcN69XSjz2Ks0vp/1nJJin+NswFTVoJ2ln/ifdmz/AMIneLlNQA1pyeJ8xYJKNBw2R4B8VNpe7k+EPHur3uzNiFh/2QMTvVhSPkKNgJ+b2RmntXyIirU/kmEvKySBwTYjMH5CvthPx6rnNdPAS0ishg+LEA6P+J/48qBOdpEacgzMk+LtJ8CDWLM9cH01Ig9PfxUZIaUA9eUV9K5VqMKkgNP6q+Gq+gR9UDzquLPuz7s2f+HXpkR5PFBF4Dp7oIBjtTZLToNdDvKOBYP/AByaslDyJRCjs+bGokQ+4uSXqz/xKy/49Gy6QyHv/G6O5LLy32uqpP8Av1R5rrRc4sgI9nmtW/wW8X/GdbPn/wDAJs7MwWMI9Vlw1FK/NjLvH3TitepvG/FEs2rvFGqc9V6DaeRsnuz7bOea32R8WGIGPdZn/hBoCh+P+IvMLznF/hvxF2eJpsu+r2kHj/ssc2VfKlmvimcNHjDdY/SwYSML/FeL1TmuXQ1SZn3tYHlPxUSrWv8Ayb9UVnypZgOv+pxzQkMAvnu9WKZPxZHJCA/mxhP+B/P6qSD/AMy78oomQElWh/BThI+afM3pQiICl5pIBsTkhH4g/mozKKvlsf8ANIh6qK8pVhQlPsoGL1M2K7UDkoi5e/VccpwnD8VHDVHmxUeBpiHD6rkKyn+vbcgXakPy16/5FbYK6KZPAgpMlYIl2DhqB0GuX/GijfJaPTRio9R9d/VmcLyEfmgKAJVRFdmxEkn20apxLH/p/wASisqZnouwvF6KtT3SITlQmk8WgAjNx1Uu/fmnAzhIfiyTw+t14YfzNiSxSzzqd8KPSgcpmHVdrl554r513WxMnL1SRKfFXMVVnZ//AIMIUyhnoUWadDzRPh4P+mZ/4BIeKKM08lmkE7WTHCtQmwtUnm/IofNeUD5p7lHVnRy92Vj2LxRRef8A8Bkx/wB5KfKXQOnhLpWfTWaI/uqok/VO1J8F5Mfd0oV51YxX66uKFeKM/wDFv//Z');
      background-size: 100%;
  }
  .SK {
      background-image: url('data:image/jpeg;base64,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');
      background-size: 100%;
  }
  .RS {
      background-image: url('data:image/jpeg;base64,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');
      background-size: 100%;
  }
  .UN {
      background-color: white;
  }
  .half {
      opacity: 0.5;
  }
</style>
