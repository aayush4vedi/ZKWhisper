"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("pages/index",{

/***/ "./$u.ts":
/*!***************!*\
  !*** ./$u.ts ***!
  \***************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   BN256ToBinUtil: function() { return /* binding */ BN256ToBinUtil; },\n/* harmony export */   BNToDecimal: function() { return /* binding */ BNToDecimal; },\n/* harmony export */   GenerateRandomBinaryArray: function() { return /* binding */ GenerateRandomBinaryArray; },\n/* harmony export */   GenerateRandomNumbers: function() { return /* binding */ GenerateRandomNumbers; },\n/* harmony export */   StringTo256Binary: function() { return /* binding */ StringTo256Binary; }\n/* harmony export */ });\n/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ethers */ \"./node_modules/ethers/dist/ethers.umd.js\");\n/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(ethers__WEBPACK_IMPORTED_MODULE_0__);\n\n/**\n * this funtion takes a BigNumber and returns a binary string of length 256\n */ const BN256ToBinUtil = (str)=>{\n    let r = BigInt(str).toString(2) // convert to binary\n    ;\n    let prePadding = \"\";\n    let paddingAmount = 256 - r.length;\n    for(var i = 0; i < paddingAmount; i++){\n        prePadding += \"0\";\n    }\n    return prePadding + r;\n};\n/**\n * generate a random binary array of size 256 using ethers\n */ const GenerateRandomBinaryArray = ()=>{\n    const randomBytes = ethers__WEBPACK_IMPORTED_MODULE_0__.ethers.utils.randomBytes(32);\n    const bigNumRandomBytes = ethers__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from(randomBytes);\n    return BN256ToBinUtil(bigNumRandomBytes).split(\"\");\n};\n// function using BN256ToBinUtil to convert a given string to a binary string of length 256\nconst StringTo256Binary = (str)=>{\n    const strToBigNum = ethers__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from(ethers__WEBPACK_IMPORTED_MODULE_0__.ethers.utils.formatBytes32String(str)) // without formatting: it fails when str contains special characters\n    ;\n    return BN256ToBinUtil(strToBigNum);\n};\nconst GenerateRandomNumbers = (count)=>{\n    console.log(\"Generating \" + count + \" random numbers\");\n    for(let i = 0; i < count; i++){\n        console.log(BigInt(ethers__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from(ethers__WEBPACK_IMPORTED_MODULE_0__.ethers.utils.randomBytes(32))));\n    }\n};\n// util to convert big number to decimal\nconst BNToDecimal = (bn)=>{\n    return ethers__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from(bn).toString();\n} // console.log(GenerateRandomNumbers(10))   // To make it run from terminal, remove 'export' from all the function and `❯ node \\$u.ts`\n;\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevExports = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevExports) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports on update so we can compare the boundary\n                // signatures.\n                module.hot.dispose(function (data) {\n                    data.prevExports = currentExports;\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevExports !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevExports, currentExports)) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevExports !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi8kdS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQTBDO0FBRTFDOztDQUVDLEdBQ00sTUFBTUUsaUJBQWlCLENBQUNDO0lBQzNCLElBQUlDLElBQUlDLE9BQU9GLEtBQUtHLFNBQVMsR0FBRyxvQkFBb0I7O0lBQ3BELElBQUlDLGFBQWE7SUFDakIsSUFBSUMsZ0JBQWdCLE1BQU1KLEVBQUVLO0lBQzVCLElBQUssSUFBSUMsSUFBSSxHQUFHQSxJQUFJRixlQUFlRSxJQUFLO1FBQ3BDSCxjQUFjO0lBQ2xCO0lBQ0EsT0FBT0EsYUFBYUg7QUFDeEIsRUFBQztBQUVEOztDQUVDLEdBQ00sTUFBTU8sNEJBQTRCO0lBQ3JDLE1BQU1DLGNBQWNYLDBDQUFNQSxDQUFDWSxNQUFNRCxZQUFZO0lBQzdDLE1BQU1FLG9CQUFvQmQsNkNBQVNBLENBQUNlLEtBQUtIO0lBQ3pDLE9BQU9WLGVBQWVZLG1CQUFtQkUsTUFBTTtBQUNuRCxFQUFDO0FBRUQsMkZBQTJGO0FBQ3BGLE1BQU1DLG9CQUFvQixDQUFDZDtJQUM5QixNQUFNZSxjQUFjbEIsNkNBQVNBLENBQUNlLEtBQUtkLDBDQUFNQSxDQUFDWSxNQUFNTSxvQkFBb0JoQixNQUFNLG9FQUFvRTs7SUFDOUksT0FBT0QsZUFBZWdCO0FBQzFCLEVBQUM7QUFFTSxNQUFNRSx3QkFBd0IsQ0FBQ0M7SUFDbENDLFFBQVFDLElBQUksZ0JBQWdCRixRQUFRO0lBQ3BDLElBQUssSUFBSVgsSUFBSSxHQUFHQSxJQUFJVyxPQUFPWCxJQUFLO1FBQzVCWSxRQUFRQyxJQUFJbEIsT0FBT0wsNkNBQVNBLENBQUNlLEtBQUtkLDBDQUFNQSxDQUFDWSxNQUFNRCxZQUFZO0lBQy9EO0FBQ0osRUFBQztBQUVELHdDQUF3QztBQUNqQyxNQUFNWSxjQUFjLENBQUNDO0lBQ3hCLE9BQU96Qiw2Q0FBU0EsQ0FBQ2UsS0FBS1UsSUFBSW5CO0FBQzlCLEVBRUEsc0lBQXNJO0NBRnJJIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vX05fRS8uLyR1LnRzPzNkMGEiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmlnTnVtYmVyLCBldGhlcnMgfSBmcm9tIFwiZXRoZXJzXCJcblxuLyoqXG4gKiB0aGlzIGZ1bnRpb24gdGFrZXMgYSBCaWdOdW1iZXIgYW5kIHJldHVybnMgYSBiaW5hcnkgc3RyaW5nIG9mIGxlbmd0aCAyNTZcbiAqL1xuZXhwb3J0IGNvbnN0IEJOMjU2VG9CaW5VdGlsID0gKHN0cjogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICBsZXQgciA9IEJpZ0ludChzdHIpLnRvU3RyaW5nKDIpIC8vIGNvbnZlcnQgdG8gYmluYXJ5XG4gICAgbGV0IHByZVBhZGRpbmcgPSBcIlwiXG4gICAgbGV0IHBhZGRpbmdBbW91bnQgPSAyNTYgLSByLmxlbmd0aFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFkZGluZ0Ftb3VudDsgaSsrKSB7XG4gICAgICAgIHByZVBhZGRpbmcgKz0gXCIwXCJcbiAgICB9XG4gICAgcmV0dXJuIHByZVBhZGRpbmcgKyByXG59XG5cbi8qKlxuICogZ2VuZXJhdGUgYSByYW5kb20gYmluYXJ5IGFycmF5IG9mIHNpemUgMjU2IHVzaW5nIGV0aGVyc1xuICovXG5leHBvcnQgY29uc3QgR2VuZXJhdGVSYW5kb21CaW5hcnlBcnJheSA9ICgpID0+IHtcbiAgICBjb25zdCByYW5kb21CeXRlcyA9IGV0aGVycy51dGlscy5yYW5kb21CeXRlcygzMilcbiAgICBjb25zdCBiaWdOdW1SYW5kb21CeXRlcyA9IEJpZ051bWJlci5mcm9tKHJhbmRvbUJ5dGVzKVxuICAgIHJldHVybiBCTjI1NlRvQmluVXRpbChiaWdOdW1SYW5kb21CeXRlcykuc3BsaXQoXCJcIilcbn1cblxuLy8gZnVuY3Rpb24gdXNpbmcgQk4yNTZUb0JpblV0aWwgdG8gY29udmVydCBhIGdpdmVuIHN0cmluZyB0byBhIGJpbmFyeSBzdHJpbmcgb2YgbGVuZ3RoIDI1NlxuZXhwb3J0IGNvbnN0IFN0cmluZ1RvMjU2QmluYXJ5ID0gKHN0cjogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBzdHJUb0JpZ051bSA9IEJpZ051bWJlci5mcm9tKGV0aGVycy51dGlscy5mb3JtYXRCeXRlczMyU3RyaW5nKHN0cikpIC8vIHdpdGhvdXQgZm9ybWF0dGluZzogaXQgZmFpbHMgd2hlbiBzdHIgY29udGFpbnMgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gICAgcmV0dXJuIEJOMjU2VG9CaW5VdGlsKHN0clRvQmlnTnVtKVxufVxuXG5leHBvcnQgY29uc3QgR2VuZXJhdGVSYW5kb21OdW1iZXJzID0gKGNvdW50OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRpbmcgXCIgKyBjb3VudCArIFwiIHJhbmRvbSBudW1iZXJzXCIpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKEJpZ0ludChCaWdOdW1iZXIuZnJvbShldGhlcnMudXRpbHMucmFuZG9tQnl0ZXMoMzIpKSkpXG4gICAgfVxufVxuXG4vLyB1dGlsIHRvIGNvbnZlcnQgYmlnIG51bWJlciB0byBkZWNpbWFsXG5leHBvcnQgY29uc3QgQk5Ub0RlY2ltYWwgPSAoYm46IEJpZ051bWJlcik6IHN0ID0+IHtcbiAgICByZXR1cm4gQmlnTnVtYmVyLmZyb20oYm4pLnRvU3RyaW5nKClcbn1cblxuLy8gY29uc29sZS5sb2coR2VuZXJhdGVSYW5kb21OdW1iZXJzKDEwKSkgICAvLyBUbyBtYWtlIGl0IHJ1biBmcm9tIHRlcm1pbmFsLCByZW1vdmUgJ2V4cG9ydCcgZnJvbSBhbGwgdGhlIGZ1bmN0aW9uIGFuZCBg4p2vIG5vZGUgXFwkdS50c2AiXSwibmFtZXMiOlsiQmlnTnVtYmVyIiwiZXRoZXJzIiwiQk4yNTZUb0JpblV0aWwiLCJzdHIiLCJyIiwiQmlnSW50IiwidG9TdHJpbmciLCJwcmVQYWRkaW5nIiwicGFkZGluZ0Ftb3VudCIsImxlbmd0aCIsImkiLCJHZW5lcmF0ZVJhbmRvbUJpbmFyeUFycmF5IiwicmFuZG9tQnl0ZXMiLCJ1dGlscyIsImJpZ051bVJhbmRvbUJ5dGVzIiwiZnJvbSIsInNwbGl0IiwiU3RyaW5nVG8yNTZCaW5hcnkiLCJzdHJUb0JpZ051bSIsImZvcm1hdEJ5dGVzMzJTdHJpbmciLCJHZW5lcmF0ZVJhbmRvbU51bWJlcnMiLCJjb3VudCIsImNvbnNvbGUiLCJsb2ciLCJCTlRvRGVjaW1hbCIsImJuIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./$u.ts\n"));

/***/ })

});