var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/qrcode-generator/qrcode.js
var require_qrcode = __commonJS({
  "node_modules/qrcode-generator/qrcode.js"(exports, module) {
    var qrcode2 = (function() {
      var qrcode3 = function(typeNumber, errorCorrectionLevel) {
        var PAD0 = 236;
        var PAD1 = 17;
        var _typeNumber = typeNumber;
        var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
        var _modules = null;
        var _moduleCount = 0;
        var _dataCache = null;
        var _dataList = [];
        var _this = {};
        var makeImpl = function(test, maskPattern) {
          _moduleCount = _typeNumber * 4 + 17;
          _modules = (function(moduleCount) {
            var modules = new Array(moduleCount);
            for (var row = 0; row < moduleCount; row += 1) {
              modules[row] = new Array(moduleCount);
              for (var col = 0; col < moduleCount; col += 1) {
                modules[row][col] = null;
              }
            }
            return modules;
          })(_moduleCount);
          setupPositionProbePattern(0, 0);
          setupPositionProbePattern(_moduleCount - 7, 0);
          setupPositionProbePattern(0, _moduleCount - 7);
          setupPositionAdjustPattern();
          setupTimingPattern();
          setupTypeInfo(test, maskPattern);
          if (_typeNumber >= 7) {
            setupTypeNumber(test);
          }
          if (_dataCache == null) {
            _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
          }
          mapData(_dataCache, maskPattern);
        };
        var setupPositionProbePattern = function(row, col) {
          for (var r = -1; r <= 7; r += 1) {
            if (row + r <= -1 || _moduleCount <= row + r) continue;
            for (var c = -1; c <= 7; c += 1) {
              if (col + c <= -1 || _moduleCount <= col + c) continue;
              if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        };
        var getBestMaskPattern = function() {
          var minLostPoint = 0;
          var pattern = 0;
          for (var i = 0; i < 8; i += 1) {
            makeImpl(true, i);
            var lostPoint = QRUtil.getLostPoint(_this);
            if (i == 0 || minLostPoint > lostPoint) {
              minLostPoint = lostPoint;
              pattern = i;
            }
          }
          return pattern;
        };
        var setupTimingPattern = function() {
          for (var r = 8; r < _moduleCount - 8; r += 1) {
            if (_modules[r][6] != null) {
              continue;
            }
            _modules[r][6] = r % 2 == 0;
          }
          for (var c = 8; c < _moduleCount - 8; c += 1) {
            if (_modules[6][c] != null) {
              continue;
            }
            _modules[6][c] = c % 2 == 0;
          }
        };
        var setupPositionAdjustPattern = function() {
          var pos = QRUtil.getPatternPosition(_typeNumber);
          for (var i = 0; i < pos.length; i += 1) {
            for (var j = 0; j < pos.length; j += 1) {
              var row = pos[i];
              var col = pos[j];
              if (_modules[row][col] != null) {
                continue;
              }
              for (var r = -2; r <= 2; r += 1) {
                for (var c = -2; c <= 2; c += 1) {
                  if (r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0) {
                    _modules[row + r][col + c] = true;
                  } else {
                    _modules[row + r][col + c] = false;
                  }
                }
              }
            }
          }
        };
        var setupTypeNumber = function(test) {
          var bits = QRUtil.getBCHTypeNumber(_typeNumber);
          for (var i = 0; i < 18; i += 1) {
            var mod = !test && (bits >> i & 1) == 1;
            _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
          }
          for (var i = 0; i < 18; i += 1) {
            var mod = !test && (bits >> i & 1) == 1;
            _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
          }
        };
        var setupTypeInfo = function(test, maskPattern) {
          var data = _errorCorrectionLevel << 3 | maskPattern;
          var bits = QRUtil.getBCHTypeInfo(data);
          for (var i = 0; i < 15; i += 1) {
            var mod = !test && (bits >> i & 1) == 1;
            if (i < 6) {
              _modules[i][8] = mod;
            } else if (i < 8) {
              _modules[i + 1][8] = mod;
            } else {
              _modules[_moduleCount - 15 + i][8] = mod;
            }
          }
          for (var i = 0; i < 15; i += 1) {
            var mod = !test && (bits >> i & 1) == 1;
            if (i < 8) {
              _modules[8][_moduleCount - i - 1] = mod;
            } else if (i < 9) {
              _modules[8][15 - i - 1 + 1] = mod;
            } else {
              _modules[8][15 - i - 1] = mod;
            }
          }
          _modules[_moduleCount - 8][8] = !test;
        };
        var mapData = function(data, maskPattern) {
          var inc = -1;
          var row = _moduleCount - 1;
          var bitIndex = 7;
          var byteIndex = 0;
          var maskFunc = QRUtil.getMaskFunction(maskPattern);
          for (var col = _moduleCount - 1; col > 0; col -= 2) {
            if (col == 6) col -= 1;
            while (true) {
              for (var c = 0; c < 2; c += 1) {
                if (_modules[row][col - c] == null) {
                  var dark = false;
                  if (byteIndex < data.length) {
                    dark = (data[byteIndex] >>> bitIndex & 1) == 1;
                  }
                  var mask = maskFunc(row, col - c);
                  if (mask) {
                    dark = !dark;
                  }
                  _modules[row][col - c] = dark;
                  bitIndex -= 1;
                  if (bitIndex == -1) {
                    byteIndex += 1;
                    bitIndex = 7;
                  }
                }
              }
              row += inc;
              if (row < 0 || _moduleCount <= row) {
                row -= inc;
                inc = -inc;
                break;
              }
            }
          }
        };
        var createBytes = function(buffer, rsBlocks) {
          var offset = 0;
          var maxDcCount = 0;
          var maxEcCount = 0;
          var dcdata = new Array(rsBlocks.length);
          var ecdata = new Array(rsBlocks.length);
          for (var r = 0; r < rsBlocks.length; r += 1) {
            var dcCount = rsBlocks[r].dataCount;
            var ecCount = rsBlocks[r].totalCount - dcCount;
            maxDcCount = Math.max(maxDcCount, dcCount);
            maxEcCount = Math.max(maxEcCount, ecCount);
            dcdata[r] = new Array(dcCount);
            for (var i = 0; i < dcdata[r].length; i += 1) {
              dcdata[r][i] = 255 & buffer.getBuffer()[i + offset];
            }
            offset += dcCount;
            var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
            var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);
            var modPoly = rawPoly.mod(rsPoly);
            ecdata[r] = new Array(rsPoly.getLength() - 1);
            for (var i = 0; i < ecdata[r].length; i += 1) {
              var modIndex = i + modPoly.getLength() - ecdata[r].length;
              ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
            }
          }
          var totalCodeCount = 0;
          for (var i = 0; i < rsBlocks.length; i += 1) {
            totalCodeCount += rsBlocks[i].totalCount;
          }
          var data = new Array(totalCodeCount);
          var index = 0;
          for (var i = 0; i < maxDcCount; i += 1) {
            for (var r = 0; r < rsBlocks.length; r += 1) {
              if (i < dcdata[r].length) {
                data[index] = dcdata[r][i];
                index += 1;
              }
            }
          }
          for (var i = 0; i < maxEcCount; i += 1) {
            for (var r = 0; r < rsBlocks.length; r += 1) {
              if (i < ecdata[r].length) {
                data[index] = ecdata[r][i];
                index += 1;
              }
            }
          }
          return data;
        };
        var createData = function(typeNumber2, errorCorrectionLevel2, dataList) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber2, errorCorrectionLevel2);
          var buffer = qrBitBuffer();
          for (var i = 0; i < dataList.length; i += 1) {
            var data = dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber2));
            data.write(buffer);
          }
          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i += 1) {
            totalDataCount += rsBlocks[i].dataCount;
          }
          if (buffer.getLengthInBits() > totalDataCount * 8) {
            throw "code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")";
          }
          if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
            buffer.put(0, 4);
          }
          while (buffer.getLengthInBits() % 8 != 0) {
            buffer.putBit(false);
          }
          while (true) {
            if (buffer.getLengthInBits() >= totalDataCount * 8) {
              break;
            }
            buffer.put(PAD0, 8);
            if (buffer.getLengthInBits() >= totalDataCount * 8) {
              break;
            }
            buffer.put(PAD1, 8);
          }
          return createBytes(buffer, rsBlocks);
        };
        _this.addData = function(data, mode) {
          mode = mode || "Byte";
          var newData = null;
          switch (mode) {
            case "Numeric":
              newData = qrNumber(data);
              break;
            case "Alphanumeric":
              newData = qrAlphaNum(data);
              break;
            case "Byte":
              newData = qr8BitByte(data);
              break;
            case "Kanji":
              newData = qrKanji(data);
              break;
            default:
              throw "mode:" + mode;
          }
          _dataList.push(newData);
          _dataCache = null;
        };
        _this.isDark = function(row, col) {
          if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
            throw row + "," + col;
          }
          return _modules[row][col];
        };
        _this.getModuleCount = function() {
          return _moduleCount;
        };
        _this.make = function() {
          if (_typeNumber < 1) {
            var typeNumber2 = 1;
            for (; typeNumber2 < 40; typeNumber2++) {
              var rsBlocks = QRRSBlock.getRSBlocks(typeNumber2, _errorCorrectionLevel);
              var buffer = qrBitBuffer();
              for (var i = 0; i < _dataList.length; i++) {
                var data = _dataList[i];
                buffer.put(data.getMode(), 4);
                buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber2));
                data.write(buffer);
              }
              var totalDataCount = 0;
              for (var i = 0; i < rsBlocks.length; i++) {
                totalDataCount += rsBlocks[i].dataCount;
              }
              if (buffer.getLengthInBits() <= totalDataCount * 8) {
                break;
              }
            }
            _typeNumber = typeNumber2;
          }
          makeImpl(false, getBestMaskPattern());
        };
        _this.createTableTag = function(cellSize, margin) {
          cellSize = cellSize || 2;
          margin = typeof margin == "undefined" ? cellSize * 4 : margin;
          var qrHtml = "";
          qrHtml += '<table style="';
          qrHtml += " border-width: 0px; border-style: none;";
          qrHtml += " border-collapse: collapse;";
          qrHtml += " padding: 0px; margin: " + margin + "px;";
          qrHtml += '">';
          qrHtml += "<tbody>";
          for (var r = 0; r < _this.getModuleCount(); r += 1) {
            qrHtml += "<tr>";
            for (var c = 0; c < _this.getModuleCount(); c += 1) {
              qrHtml += '<td style="';
              qrHtml += " border-width: 0px; border-style: none;";
              qrHtml += " border-collapse: collapse;";
              qrHtml += " padding: 0px; margin: 0px;";
              qrHtml += " width: " + cellSize + "px;";
              qrHtml += " height: " + cellSize + "px;";
              qrHtml += " background-color: ";
              qrHtml += _this.isDark(r, c) ? "#000000" : "#ffffff";
              qrHtml += ";";
              qrHtml += '"/>';
            }
            qrHtml += "</tr>";
          }
          qrHtml += "</tbody>";
          qrHtml += "</table>";
          return qrHtml;
        };
        _this.createSvgTag = function(cellSize, margin, alt, title) {
          var opts = {};
          if (typeof arguments[0] == "object") {
            opts = arguments[0];
            cellSize = opts.cellSize;
            margin = opts.margin;
            alt = opts.alt;
            title = opts.title;
          }
          cellSize = cellSize || 2;
          margin = typeof margin == "undefined" ? cellSize * 4 : margin;
          alt = typeof alt === "string" ? { text: alt } : alt || {};
          alt.text = alt.text || null;
          alt.id = alt.text ? alt.id || "qrcode-description" : null;
          title = typeof title === "string" ? { text: title } : title || {};
          title.text = title.text || null;
          title.id = title.text ? title.id || "qrcode-title" : null;
          var size = _this.getModuleCount() * cellSize + margin * 2;
          var c, mc, r, mr, qrSvg = "", rect;
          rect = "l" + cellSize + ",0 0," + cellSize + " -" + cellSize + ",0 0,-" + cellSize + "z ";
          qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
          qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : "";
          qrSvg += ' viewBox="0 0 ' + size + " " + size + '" ';
          qrSvg += ' preserveAspectRatio="xMinYMin meet"';
          qrSvg += title.text || alt.text ? ' role="img" aria-labelledby="' + escapeXml([title.id, alt.id].join(" ").trim()) + '"' : "";
          qrSvg += ">";
          qrSvg += title.text ? '<title id="' + escapeXml(title.id) + '">' + escapeXml(title.text) + "</title>" : "";
          qrSvg += alt.text ? '<description id="' + escapeXml(alt.id) + '">' + escapeXml(alt.text) + "</description>" : "";
          qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
          qrSvg += '<path d="';
          for (r = 0; r < _this.getModuleCount(); r += 1) {
            mr = r * cellSize + margin;
            for (c = 0; c < _this.getModuleCount(); c += 1) {
              if (_this.isDark(r, c)) {
                mc = c * cellSize + margin;
                qrSvg += "M" + mc + "," + mr + rect;
              }
            }
          }
          qrSvg += '" stroke="transparent" fill="black"/>';
          qrSvg += "</svg>";
          return qrSvg;
        };
        _this.createDataURL = function(cellSize, margin) {
          cellSize = cellSize || 2;
          margin = typeof margin == "undefined" ? cellSize * 4 : margin;
          var size = _this.getModuleCount() * cellSize + margin * 2;
          var min = margin;
          var max = size - margin;
          return createDataURL(size, size, function(x, y) {
            if (min <= x && x < max && min <= y && y < max) {
              var c = Math.floor((x - min) / cellSize);
              var r = Math.floor((y - min) / cellSize);
              return _this.isDark(r, c) ? 0 : 1;
            } else {
              return 1;
            }
          });
        };
        _this.createImgTag = function(cellSize, margin, alt) {
          cellSize = cellSize || 2;
          margin = typeof margin == "undefined" ? cellSize * 4 : margin;
          var size = _this.getModuleCount() * cellSize + margin * 2;
          var img = "";
          img += "<img";
          img += ' src="';
          img += _this.createDataURL(cellSize, margin);
          img += '"';
          img += ' width="';
          img += size;
          img += '"';
          img += ' height="';
          img += size;
          img += '"';
          if (alt) {
            img += ' alt="';
            img += escapeXml(alt);
            img += '"';
          }
          img += "/>";
          return img;
        };
        var escapeXml = function(s) {
          var escaped = "";
          for (var i = 0; i < s.length; i += 1) {
            var c = s.charAt(i);
            switch (c) {
              case "<":
                escaped += "&lt;";
                break;
              case ">":
                escaped += "&gt;";
                break;
              case "&":
                escaped += "&amp;";
                break;
              case '"':
                escaped += "&quot;";
                break;
              default:
                escaped += c;
                break;
            }
          }
          return escaped;
        };
        var _createHalfASCII = function(margin) {
          var cellSize = 1;
          margin = typeof margin == "undefined" ? cellSize * 2 : margin;
          var size = _this.getModuleCount() * cellSize + margin * 2;
          var min = margin;
          var max = size - margin;
          var y, x, r1, r2, p;
          var blocks = {
            "\u2588\u2588": "\u2588",
            "\u2588 ": "\u2580",
            " \u2588": "\u2584",
            "  ": " "
          };
          var blocksLastLineNoMargin = {
            "\u2588\u2588": "\u2580",
            "\u2588 ": "\u2580",
            " \u2588": " ",
            "  ": " "
          };
          var ascii = "";
          for (y = 0; y < size; y += 2) {
            r1 = Math.floor((y - min) / cellSize);
            r2 = Math.floor((y + 1 - min) / cellSize);
            for (x = 0; x < size; x += 1) {
              p = "\u2588";
              if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
                p = " ";
              }
              if (min <= x && x < max && min <= y + 1 && y + 1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
                p += " ";
              } else {
                p += "\u2588";
              }
              ascii += margin < 1 && y + 1 >= max ? blocksLastLineNoMargin[p] : blocks[p];
            }
            ascii += "\n";
          }
          if (size % 2 && margin > 0) {
            return ascii.substring(0, ascii.length - size - 1) + Array(size + 1).join("\u2580");
          }
          return ascii.substring(0, ascii.length - 1);
        };
        _this.createASCII = function(cellSize, margin) {
          cellSize = cellSize || 1;
          if (cellSize < 2) {
            return _createHalfASCII(margin);
          }
          cellSize -= 1;
          margin = typeof margin == "undefined" ? cellSize * 2 : margin;
          var size = _this.getModuleCount() * cellSize + margin * 2;
          var min = margin;
          var max = size - margin;
          var y, x, r, p;
          var white = Array(cellSize + 1).join("\u2588\u2588");
          var black = Array(cellSize + 1).join("  ");
          var ascii = "";
          var line = "";
          for (y = 0; y < size; y += 1) {
            r = Math.floor((y - min) / cellSize);
            line = "";
            for (x = 0; x < size; x += 1) {
              p = 1;
              if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
                p = 0;
              }
              line += p ? white : black;
            }
            for (r = 0; r < cellSize; r += 1) {
              ascii += line + "\n";
            }
          }
          return ascii.substring(0, ascii.length - 1);
        };
        _this.renderTo2dContext = function(context, cellSize) {
          cellSize = cellSize || 2;
          var length = _this.getModuleCount();
          for (var row = 0; row < length; row++) {
            for (var col = 0; col < length; col++) {
              context.fillStyle = _this.isDark(row, col) ? "black" : "white";
              context.fillRect(row * cellSize, col * cellSize, cellSize, cellSize);
            }
          }
        };
        return _this;
      };
      qrcode3.stringToBytesFuncs = {
        "default": function(s) {
          var bytes = [];
          for (var i = 0; i < s.length; i += 1) {
            var c = s.charCodeAt(i);
            bytes.push(c & 255);
          }
          return bytes;
        }
      };
      qrcode3.stringToBytes = qrcode3.stringToBytesFuncs["default"];
      qrcode3.createStringToBytes = function(unicodeData, numChars) {
        var unicodeMap = (function() {
          var bin = base64DecodeInputStream(unicodeData);
          var read = function() {
            var b = bin.read();
            if (b == -1) throw "eof";
            return b;
          };
          var count = 0;
          var unicodeMap2 = {};
          while (true) {
            var b0 = bin.read();
            if (b0 == -1) break;
            var b1 = read();
            var b2 = read();
            var b3 = read();
            var k = String.fromCharCode(b0 << 8 | b1);
            var v = b2 << 8 | b3;
            unicodeMap2[k] = v;
            count += 1;
          }
          if (count != numChars) {
            throw count + " != " + numChars;
          }
          return unicodeMap2;
        })();
        var unknownChar = "?".charCodeAt(0);
        return function(s) {
          var bytes = [];
          for (var i = 0; i < s.length; i += 1) {
            var c = s.charCodeAt(i);
            if (c < 128) {
              bytes.push(c);
            } else {
              var b = unicodeMap[s.charAt(i)];
              if (typeof b == "number") {
                if ((b & 255) == b) {
                  bytes.push(b);
                } else {
                  bytes.push(b >>> 8);
                  bytes.push(b & 255);
                }
              } else {
                bytes.push(unknownChar);
              }
            }
          }
          return bytes;
        };
      };
      var QRMode = {
        MODE_NUMBER: 1 << 0,
        MODE_ALPHA_NUM: 1 << 1,
        MODE_8BIT_BYTE: 1 << 2,
        MODE_KANJI: 1 << 3
      };
      var QRErrorCorrectionLevel = {
        L: 1,
        M: 0,
        Q: 3,
        H: 2
      };
      var QRMaskPattern = {
        PATTERN000: 0,
        PATTERN001: 1,
        PATTERN010: 2,
        PATTERN011: 3,
        PATTERN100: 4,
        PATTERN101: 5,
        PATTERN110: 6,
        PATTERN111: 7
      };
      var QRUtil = (function() {
        var PATTERN_POSITION_TABLE = [
          [],
          [6, 18],
          [6, 22],
          [6, 26],
          [6, 30],
          [6, 34],
          [6, 22, 38],
          [6, 24, 42],
          [6, 26, 46],
          [6, 28, 50],
          [6, 30, 54],
          [6, 32, 58],
          [6, 34, 62],
          [6, 26, 46, 66],
          [6, 26, 48, 70],
          [6, 26, 50, 74],
          [6, 30, 54, 78],
          [6, 30, 56, 82],
          [6, 30, 58, 86],
          [6, 34, 62, 90],
          [6, 28, 50, 72, 94],
          [6, 26, 50, 74, 98],
          [6, 30, 54, 78, 102],
          [6, 28, 54, 80, 106],
          [6, 32, 58, 84, 110],
          [6, 30, 58, 86, 114],
          [6, 34, 62, 90, 118],
          [6, 26, 50, 74, 98, 122],
          [6, 30, 54, 78, 102, 126],
          [6, 26, 52, 78, 104, 130],
          [6, 30, 56, 82, 108, 134],
          [6, 34, 60, 86, 112, 138],
          [6, 30, 58, 86, 114, 142],
          [6, 34, 62, 90, 118, 146],
          [6, 30, 54, 78, 102, 126, 150],
          [6, 24, 50, 76, 102, 128, 154],
          [6, 28, 54, 80, 106, 132, 158],
          [6, 32, 58, 84, 110, 136, 162],
          [6, 26, 54, 82, 110, 138, 166],
          [6, 30, 58, 86, 114, 142, 170]
        ];
        var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
        var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
        var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
        var _this = {};
        var getBCHDigit = function(data) {
          var digit = 0;
          while (data != 0) {
            digit += 1;
            data >>>= 1;
          }
          return digit;
        };
        _this.getBCHTypeInfo = function(data) {
          var d = data << 10;
          while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
            d ^= G15 << getBCHDigit(d) - getBCHDigit(G15);
          }
          return (data << 10 | d) ^ G15_MASK;
        };
        _this.getBCHTypeNumber = function(data) {
          var d = data << 12;
          while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
            d ^= G18 << getBCHDigit(d) - getBCHDigit(G18);
          }
          return data << 12 | d;
        };
        _this.getPatternPosition = function(typeNumber) {
          return PATTERN_POSITION_TABLE[typeNumber - 1];
        };
        _this.getMaskFunction = function(maskPattern) {
          switch (maskPattern) {
            case QRMaskPattern.PATTERN000:
              return function(i, j) {
                return (i + j) % 2 == 0;
              };
            case QRMaskPattern.PATTERN001:
              return function(i, j) {
                return i % 2 == 0;
              };
            case QRMaskPattern.PATTERN010:
              return function(i, j) {
                return j % 3 == 0;
              };
            case QRMaskPattern.PATTERN011:
              return function(i, j) {
                return (i + j) % 3 == 0;
              };
            case QRMaskPattern.PATTERN100:
              return function(i, j) {
                return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
              };
            case QRMaskPattern.PATTERN101:
              return function(i, j) {
                return i * j % 2 + i * j % 3 == 0;
              };
            case QRMaskPattern.PATTERN110:
              return function(i, j) {
                return (i * j % 2 + i * j % 3) % 2 == 0;
              };
            case QRMaskPattern.PATTERN111:
              return function(i, j) {
                return (i * j % 3 + (i + j) % 2) % 2 == 0;
              };
            default:
              throw "bad maskPattern:" + maskPattern;
          }
        };
        _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
          var a = qrPolynomial([1], 0);
          for (var i = 0; i < errorCorrectLength; i += 1) {
            a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0));
          }
          return a;
        };
        _this.getLengthInBits = function(mode, type) {
          if (1 <= type && type < 10) {
            switch (mode) {
              case QRMode.MODE_NUMBER:
                return 10;
              case QRMode.MODE_ALPHA_NUM:
                return 9;
              case QRMode.MODE_8BIT_BYTE:
                return 8;
              case QRMode.MODE_KANJI:
                return 8;
              default:
                throw "mode:" + mode;
            }
          } else if (type < 27) {
            switch (mode) {
              case QRMode.MODE_NUMBER:
                return 12;
              case QRMode.MODE_ALPHA_NUM:
                return 11;
              case QRMode.MODE_8BIT_BYTE:
                return 16;
              case QRMode.MODE_KANJI:
                return 10;
              default:
                throw "mode:" + mode;
            }
          } else if (type < 41) {
            switch (mode) {
              case QRMode.MODE_NUMBER:
                return 14;
              case QRMode.MODE_ALPHA_NUM:
                return 13;
              case QRMode.MODE_8BIT_BYTE:
                return 16;
              case QRMode.MODE_KANJI:
                return 12;
              default:
                throw "mode:" + mode;
            }
          } else {
            throw "type:" + type;
          }
        };
        _this.getLostPoint = function(qrcode4) {
          var moduleCount = qrcode4.getModuleCount();
          var lostPoint = 0;
          for (var row = 0; row < moduleCount; row += 1) {
            for (var col = 0; col < moduleCount; col += 1) {
              var sameCount = 0;
              var dark = qrcode4.isDark(row, col);
              for (var r = -1; r <= 1; r += 1) {
                if (row + r < 0 || moduleCount <= row + r) {
                  continue;
                }
                for (var c = -1; c <= 1; c += 1) {
                  if (col + c < 0 || moduleCount <= col + c) {
                    continue;
                  }
                  if (r == 0 && c == 0) {
                    continue;
                  }
                  if (dark == qrcode4.isDark(row + r, col + c)) {
                    sameCount += 1;
                  }
                }
              }
              if (sameCount > 5) {
                lostPoint += 3 + sameCount - 5;
              }
            }
          }
          ;
          for (var row = 0; row < moduleCount - 1; row += 1) {
            for (var col = 0; col < moduleCount - 1; col += 1) {
              var count = 0;
              if (qrcode4.isDark(row, col)) count += 1;
              if (qrcode4.isDark(row + 1, col)) count += 1;
              if (qrcode4.isDark(row, col + 1)) count += 1;
              if (qrcode4.isDark(row + 1, col + 1)) count += 1;
              if (count == 0 || count == 4) {
                lostPoint += 3;
              }
            }
          }
          for (var row = 0; row < moduleCount; row += 1) {
            for (var col = 0; col < moduleCount - 6; col += 1) {
              if (qrcode4.isDark(row, col) && !qrcode4.isDark(row, col + 1) && qrcode4.isDark(row, col + 2) && qrcode4.isDark(row, col + 3) && qrcode4.isDark(row, col + 4) && !qrcode4.isDark(row, col + 5) && qrcode4.isDark(row, col + 6)) {
                lostPoint += 40;
              }
            }
          }
          for (var col = 0; col < moduleCount; col += 1) {
            for (var row = 0; row < moduleCount - 6; row += 1) {
              if (qrcode4.isDark(row, col) && !qrcode4.isDark(row + 1, col) && qrcode4.isDark(row + 2, col) && qrcode4.isDark(row + 3, col) && qrcode4.isDark(row + 4, col) && !qrcode4.isDark(row + 5, col) && qrcode4.isDark(row + 6, col)) {
                lostPoint += 40;
              }
            }
          }
          var darkCount = 0;
          for (var col = 0; col < moduleCount; col += 1) {
            for (var row = 0; row < moduleCount; row += 1) {
              if (qrcode4.isDark(row, col)) {
                darkCount += 1;
              }
            }
          }
          var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
          lostPoint += ratio * 10;
          return lostPoint;
        };
        return _this;
      })();
      var QRMath = (function() {
        var EXP_TABLE = new Array(256);
        var LOG_TABLE = new Array(256);
        for (var i = 0; i < 8; i += 1) {
          EXP_TABLE[i] = 1 << i;
        }
        for (var i = 8; i < 256; i += 1) {
          EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
        }
        for (var i = 0; i < 255; i += 1) {
          LOG_TABLE[EXP_TABLE[i]] = i;
        }
        var _this = {};
        _this.glog = function(n) {
          if (n < 1) {
            throw "glog(" + n + ")";
          }
          return LOG_TABLE[n];
        };
        _this.gexp = function(n) {
          while (n < 0) {
            n += 255;
          }
          while (n >= 256) {
            n -= 255;
          }
          return EXP_TABLE[n];
        };
        return _this;
      })();
      function qrPolynomial(num, shift) {
        if (typeof num.length == "undefined") {
          throw num.length + "/" + shift;
        }
        var _num = (function() {
          var offset = 0;
          while (offset < num.length && num[offset] == 0) {
            offset += 1;
          }
          var _num2 = new Array(num.length - offset + shift);
          for (var i = 0; i < num.length - offset; i += 1) {
            _num2[i] = num[i + offset];
          }
          return _num2;
        })();
        var _this = {};
        _this.getAt = function(index) {
          return _num[index];
        };
        _this.getLength = function() {
          return _num.length;
        };
        _this.multiply = function(e) {
          var num2 = new Array(_this.getLength() + e.getLength() - 1);
          for (var i = 0; i < _this.getLength(); i += 1) {
            for (var j = 0; j < e.getLength(); j += 1) {
              num2[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i)) + QRMath.glog(e.getAt(j)));
            }
          }
          return qrPolynomial(num2, 0);
        };
        _this.mod = function(e) {
          if (_this.getLength() - e.getLength() < 0) {
            return _this;
          }
          var ratio = QRMath.glog(_this.getAt(0)) - QRMath.glog(e.getAt(0));
          var num2 = new Array(_this.getLength());
          for (var i = 0; i < _this.getLength(); i += 1) {
            num2[i] = _this.getAt(i);
          }
          for (var i = 0; i < e.getLength(); i += 1) {
            num2[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio);
          }
          return qrPolynomial(num2, 0).mod(e);
        };
        return _this;
      }
      ;
      var QRRSBlock = (function() {
        var RS_BLOCK_TABLE = [
          // L
          // M
          // Q
          // H
          // 1
          [1, 26, 19],
          [1, 26, 16],
          [1, 26, 13],
          [1, 26, 9],
          // 2
          [1, 44, 34],
          [1, 44, 28],
          [1, 44, 22],
          [1, 44, 16],
          // 3
          [1, 70, 55],
          [1, 70, 44],
          [2, 35, 17],
          [2, 35, 13],
          // 4
          [1, 100, 80],
          [2, 50, 32],
          [2, 50, 24],
          [4, 25, 9],
          // 5
          [1, 134, 108],
          [2, 67, 43],
          [2, 33, 15, 2, 34, 16],
          [2, 33, 11, 2, 34, 12],
          // 6
          [2, 86, 68],
          [4, 43, 27],
          [4, 43, 19],
          [4, 43, 15],
          // 7
          [2, 98, 78],
          [4, 49, 31],
          [2, 32, 14, 4, 33, 15],
          [4, 39, 13, 1, 40, 14],
          // 8
          [2, 121, 97],
          [2, 60, 38, 2, 61, 39],
          [4, 40, 18, 2, 41, 19],
          [4, 40, 14, 2, 41, 15],
          // 9
          [2, 146, 116],
          [3, 58, 36, 2, 59, 37],
          [4, 36, 16, 4, 37, 17],
          [4, 36, 12, 4, 37, 13],
          // 10
          [2, 86, 68, 2, 87, 69],
          [4, 69, 43, 1, 70, 44],
          [6, 43, 19, 2, 44, 20],
          [6, 43, 15, 2, 44, 16],
          // 11
          [4, 101, 81],
          [1, 80, 50, 4, 81, 51],
          [4, 50, 22, 4, 51, 23],
          [3, 36, 12, 8, 37, 13],
          // 12
          [2, 116, 92, 2, 117, 93],
          [6, 58, 36, 2, 59, 37],
          [4, 46, 20, 6, 47, 21],
          [7, 42, 14, 4, 43, 15],
          // 13
          [4, 133, 107],
          [8, 59, 37, 1, 60, 38],
          [8, 44, 20, 4, 45, 21],
          [12, 33, 11, 4, 34, 12],
          // 14
          [3, 145, 115, 1, 146, 116],
          [4, 64, 40, 5, 65, 41],
          [11, 36, 16, 5, 37, 17],
          [11, 36, 12, 5, 37, 13],
          // 15
          [5, 109, 87, 1, 110, 88],
          [5, 65, 41, 5, 66, 42],
          [5, 54, 24, 7, 55, 25],
          [11, 36, 12, 7, 37, 13],
          // 16
          [5, 122, 98, 1, 123, 99],
          [7, 73, 45, 3, 74, 46],
          [15, 43, 19, 2, 44, 20],
          [3, 45, 15, 13, 46, 16],
          // 17
          [1, 135, 107, 5, 136, 108],
          [10, 74, 46, 1, 75, 47],
          [1, 50, 22, 15, 51, 23],
          [2, 42, 14, 17, 43, 15],
          // 18
          [5, 150, 120, 1, 151, 121],
          [9, 69, 43, 4, 70, 44],
          [17, 50, 22, 1, 51, 23],
          [2, 42, 14, 19, 43, 15],
          // 19
          [3, 141, 113, 4, 142, 114],
          [3, 70, 44, 11, 71, 45],
          [17, 47, 21, 4, 48, 22],
          [9, 39, 13, 16, 40, 14],
          // 20
          [3, 135, 107, 5, 136, 108],
          [3, 67, 41, 13, 68, 42],
          [15, 54, 24, 5, 55, 25],
          [15, 43, 15, 10, 44, 16],
          // 21
          [4, 144, 116, 4, 145, 117],
          [17, 68, 42],
          [17, 50, 22, 6, 51, 23],
          [19, 46, 16, 6, 47, 17],
          // 22
          [2, 139, 111, 7, 140, 112],
          [17, 74, 46],
          [7, 54, 24, 16, 55, 25],
          [34, 37, 13],
          // 23
          [4, 151, 121, 5, 152, 122],
          [4, 75, 47, 14, 76, 48],
          [11, 54, 24, 14, 55, 25],
          [16, 45, 15, 14, 46, 16],
          // 24
          [6, 147, 117, 4, 148, 118],
          [6, 73, 45, 14, 74, 46],
          [11, 54, 24, 16, 55, 25],
          [30, 46, 16, 2, 47, 17],
          // 25
          [8, 132, 106, 4, 133, 107],
          [8, 75, 47, 13, 76, 48],
          [7, 54, 24, 22, 55, 25],
          [22, 45, 15, 13, 46, 16],
          // 26
          [10, 142, 114, 2, 143, 115],
          [19, 74, 46, 4, 75, 47],
          [28, 50, 22, 6, 51, 23],
          [33, 46, 16, 4, 47, 17],
          // 27
          [8, 152, 122, 4, 153, 123],
          [22, 73, 45, 3, 74, 46],
          [8, 53, 23, 26, 54, 24],
          [12, 45, 15, 28, 46, 16],
          // 28
          [3, 147, 117, 10, 148, 118],
          [3, 73, 45, 23, 74, 46],
          [4, 54, 24, 31, 55, 25],
          [11, 45, 15, 31, 46, 16],
          // 29
          [7, 146, 116, 7, 147, 117],
          [21, 73, 45, 7, 74, 46],
          [1, 53, 23, 37, 54, 24],
          [19, 45, 15, 26, 46, 16],
          // 30
          [5, 145, 115, 10, 146, 116],
          [19, 75, 47, 10, 76, 48],
          [15, 54, 24, 25, 55, 25],
          [23, 45, 15, 25, 46, 16],
          // 31
          [13, 145, 115, 3, 146, 116],
          [2, 74, 46, 29, 75, 47],
          [42, 54, 24, 1, 55, 25],
          [23, 45, 15, 28, 46, 16],
          // 32
          [17, 145, 115],
          [10, 74, 46, 23, 75, 47],
          [10, 54, 24, 35, 55, 25],
          [19, 45, 15, 35, 46, 16],
          // 33
          [17, 145, 115, 1, 146, 116],
          [14, 74, 46, 21, 75, 47],
          [29, 54, 24, 19, 55, 25],
          [11, 45, 15, 46, 46, 16],
          // 34
          [13, 145, 115, 6, 146, 116],
          [14, 74, 46, 23, 75, 47],
          [44, 54, 24, 7, 55, 25],
          [59, 46, 16, 1, 47, 17],
          // 35
          [12, 151, 121, 7, 152, 122],
          [12, 75, 47, 26, 76, 48],
          [39, 54, 24, 14, 55, 25],
          [22, 45, 15, 41, 46, 16],
          // 36
          [6, 151, 121, 14, 152, 122],
          [6, 75, 47, 34, 76, 48],
          [46, 54, 24, 10, 55, 25],
          [2, 45, 15, 64, 46, 16],
          // 37
          [17, 152, 122, 4, 153, 123],
          [29, 74, 46, 14, 75, 47],
          [49, 54, 24, 10, 55, 25],
          [24, 45, 15, 46, 46, 16],
          // 38
          [4, 152, 122, 18, 153, 123],
          [13, 74, 46, 32, 75, 47],
          [48, 54, 24, 14, 55, 25],
          [42, 45, 15, 32, 46, 16],
          // 39
          [20, 147, 117, 4, 148, 118],
          [40, 75, 47, 7, 76, 48],
          [43, 54, 24, 22, 55, 25],
          [10, 45, 15, 67, 46, 16],
          // 40
          [19, 148, 118, 6, 149, 119],
          [18, 75, 47, 31, 76, 48],
          [34, 54, 24, 34, 55, 25],
          [20, 45, 15, 61, 46, 16]
        ];
        var qrRSBlock = function(totalCount, dataCount) {
          var _this2 = {};
          _this2.totalCount = totalCount;
          _this2.dataCount = dataCount;
          return _this2;
        };
        var _this = {};
        var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {
          switch (errorCorrectionLevel) {
            case QRErrorCorrectionLevel.L:
              return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
            case QRErrorCorrectionLevel.M:
              return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
            case QRErrorCorrectionLevel.Q:
              return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
            case QRErrorCorrectionLevel.H:
              return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
            default:
              return void 0;
          }
        };
        _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {
          var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);
          if (typeof rsBlock == "undefined") {
            throw "bad rs block @ typeNumber:" + typeNumber + "/errorCorrectionLevel:" + errorCorrectionLevel;
          }
          var length = rsBlock.length / 3;
          var list = [];
          for (var i = 0; i < length; i += 1) {
            var count = rsBlock[i * 3 + 0];
            var totalCount = rsBlock[i * 3 + 1];
            var dataCount = rsBlock[i * 3 + 2];
            for (var j = 0; j < count; j += 1) {
              list.push(qrRSBlock(totalCount, dataCount));
            }
          }
          return list;
        };
        return _this;
      })();
      var qrBitBuffer = function() {
        var _buffer = [];
        var _length = 0;
        var _this = {};
        _this.getBuffer = function() {
          return _buffer;
        };
        _this.getAt = function(index) {
          var bufIndex = Math.floor(index / 8);
          return (_buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
        };
        _this.put = function(num, length) {
          for (var i = 0; i < length; i += 1) {
            _this.putBit((num >>> length - i - 1 & 1) == 1);
          }
        };
        _this.getLengthInBits = function() {
          return _length;
        };
        _this.putBit = function(bit) {
          var bufIndex = Math.floor(_length / 8);
          if (_buffer.length <= bufIndex) {
            _buffer.push(0);
          }
          if (bit) {
            _buffer[bufIndex] |= 128 >>> _length % 8;
          }
          _length += 1;
        };
        return _this;
      };
      var qrNumber = function(data) {
        var _mode = QRMode.MODE_NUMBER;
        var _data = data;
        var _this = {};
        _this.getMode = function() {
          return _mode;
        };
        _this.getLength = function(buffer) {
          return _data.length;
        };
        _this.write = function(buffer) {
          var data2 = _data;
          var i = 0;
          while (i + 2 < data2.length) {
            buffer.put(strToNum(data2.substring(i, i + 3)), 10);
            i += 3;
          }
          if (i < data2.length) {
            if (data2.length - i == 1) {
              buffer.put(strToNum(data2.substring(i, i + 1)), 4);
            } else if (data2.length - i == 2) {
              buffer.put(strToNum(data2.substring(i, i + 2)), 7);
            }
          }
        };
        var strToNum = function(s) {
          var num = 0;
          for (var i = 0; i < s.length; i += 1) {
            num = num * 10 + chatToNum(s.charAt(i));
          }
          return num;
        };
        var chatToNum = function(c) {
          if ("0" <= c && c <= "9") {
            return c.charCodeAt(0) - "0".charCodeAt(0);
          }
          throw "illegal char :" + c;
        };
        return _this;
      };
      var qrAlphaNum = function(data) {
        var _mode = QRMode.MODE_ALPHA_NUM;
        var _data = data;
        var _this = {};
        _this.getMode = function() {
          return _mode;
        };
        _this.getLength = function(buffer) {
          return _data.length;
        };
        _this.write = function(buffer) {
          var s = _data;
          var i = 0;
          while (i + 1 < s.length) {
            buffer.put(
              getCode(s.charAt(i)) * 45 + getCode(s.charAt(i + 1)),
              11
            );
            i += 2;
          }
          if (i < s.length) {
            buffer.put(getCode(s.charAt(i)), 6);
          }
        };
        var getCode = function(c) {
          if ("0" <= c && c <= "9") {
            return c.charCodeAt(0) - "0".charCodeAt(0);
          } else if ("A" <= c && c <= "Z") {
            return c.charCodeAt(0) - "A".charCodeAt(0) + 10;
          } else {
            switch (c) {
              case " ":
                return 36;
              case "$":
                return 37;
              case "%":
                return 38;
              case "*":
                return 39;
              case "+":
                return 40;
              case "-":
                return 41;
              case ".":
                return 42;
              case "/":
                return 43;
              case ":":
                return 44;
              default:
                throw "illegal char :" + c;
            }
          }
        };
        return _this;
      };
      var qr8BitByte = function(data) {
        var _mode = QRMode.MODE_8BIT_BYTE;
        var _data = data;
        var _bytes = qrcode3.stringToBytes(data);
        var _this = {};
        _this.getMode = function() {
          return _mode;
        };
        _this.getLength = function(buffer) {
          return _bytes.length;
        };
        _this.write = function(buffer) {
          for (var i = 0; i < _bytes.length; i += 1) {
            buffer.put(_bytes[i], 8);
          }
        };
        return _this;
      };
      var qrKanji = function(data) {
        var _mode = QRMode.MODE_KANJI;
        var _data = data;
        var stringToBytes = qrcode3.stringToBytesFuncs["SJIS"];
        if (!stringToBytes) {
          throw "sjis not supported.";
        }
        !(function(c, code) {
          var test = stringToBytes(c);
          if (test.length != 2 || (test[0] << 8 | test[1]) != code) {
            throw "sjis not supported.";
          }
        })("\u53CB", 38726);
        var _bytes = stringToBytes(data);
        var _this = {};
        _this.getMode = function() {
          return _mode;
        };
        _this.getLength = function(buffer) {
          return ~~(_bytes.length / 2);
        };
        _this.write = function(buffer) {
          var data2 = _bytes;
          var i = 0;
          while (i + 1 < data2.length) {
            var c = (255 & data2[i]) << 8 | 255 & data2[i + 1];
            if (33088 <= c && c <= 40956) {
              c -= 33088;
            } else if (57408 <= c && c <= 60351) {
              c -= 49472;
            } else {
              throw "illegal char at " + (i + 1) + "/" + c;
            }
            c = (c >>> 8 & 255) * 192 + (c & 255);
            buffer.put(c, 13);
            i += 2;
          }
          if (i < data2.length) {
            throw "illegal char at " + (i + 1);
          }
        };
        return _this;
      };
      var byteArrayOutputStream = function() {
        var _bytes = [];
        var _this = {};
        _this.writeByte = function(b) {
          _bytes.push(b & 255);
        };
        _this.writeShort = function(i) {
          _this.writeByte(i);
          _this.writeByte(i >>> 8);
        };
        _this.writeBytes = function(b, off, len) {
          off = off || 0;
          len = len || b.length;
          for (var i = 0; i < len; i += 1) {
            _this.writeByte(b[i + off]);
          }
        };
        _this.writeString = function(s) {
          for (var i = 0; i < s.length; i += 1) {
            _this.writeByte(s.charCodeAt(i));
          }
        };
        _this.toByteArray = function() {
          return _bytes;
        };
        _this.toString = function() {
          var s = "";
          s += "[";
          for (var i = 0; i < _bytes.length; i += 1) {
            if (i > 0) {
              s += ",";
            }
            s += _bytes[i];
          }
          s += "]";
          return s;
        };
        return _this;
      };
      var base64EncodeOutputStream = function() {
        var _buffer = 0;
        var _buflen = 0;
        var _length = 0;
        var _base64 = "";
        var _this = {};
        var writeEncoded = function(b) {
          _base64 += String.fromCharCode(encode(b & 63));
        };
        var encode = function(n) {
          if (n < 0) {
          } else if (n < 26) {
            return 65 + n;
          } else if (n < 52) {
            return 97 + (n - 26);
          } else if (n < 62) {
            return 48 + (n - 52);
          } else if (n == 62) {
            return 43;
          } else if (n == 63) {
            return 47;
          }
          throw "n:" + n;
        };
        _this.writeByte = function(n) {
          _buffer = _buffer << 8 | n & 255;
          _buflen += 8;
          _length += 1;
          while (_buflen >= 6) {
            writeEncoded(_buffer >>> _buflen - 6);
            _buflen -= 6;
          }
        };
        _this.flush = function() {
          if (_buflen > 0) {
            writeEncoded(_buffer << 6 - _buflen);
            _buffer = 0;
            _buflen = 0;
          }
          if (_length % 3 != 0) {
            var padlen = 3 - _length % 3;
            for (var i = 0; i < padlen; i += 1) {
              _base64 += "=";
            }
          }
        };
        _this.toString = function() {
          return _base64;
        };
        return _this;
      };
      var base64DecodeInputStream = function(str) {
        var _str = str;
        var _pos = 0;
        var _buffer = 0;
        var _buflen = 0;
        var _this = {};
        _this.read = function() {
          while (_buflen < 8) {
            if (_pos >= _str.length) {
              if (_buflen == 0) {
                return -1;
              }
              throw "unexpected end of file./" + _buflen;
            }
            var c = _str.charAt(_pos);
            _pos += 1;
            if (c == "=") {
              _buflen = 0;
              return -1;
            } else if (c.match(/^\s$/)) {
              continue;
            }
            _buffer = _buffer << 6 | decode(c.charCodeAt(0));
            _buflen += 6;
          }
          var n = _buffer >>> _buflen - 8 & 255;
          _buflen -= 8;
          return n;
        };
        var decode = function(c) {
          if (65 <= c && c <= 90) {
            return c - 65;
          } else if (97 <= c && c <= 122) {
            return c - 97 + 26;
          } else if (48 <= c && c <= 57) {
            return c - 48 + 52;
          } else if (c == 43) {
            return 62;
          } else if (c == 47) {
            return 63;
          } else {
            throw "c:" + c;
          }
        };
        return _this;
      };
      var gifImage = function(width, height) {
        var _width = width;
        var _height = height;
        var _data = new Array(width * height);
        var _this = {};
        _this.setPixel = function(x, y, pixel) {
          _data[y * _width + x] = pixel;
        };
        _this.write = function(out) {
          out.writeString("GIF87a");
          out.writeShort(_width);
          out.writeShort(_height);
          out.writeByte(128);
          out.writeByte(0);
          out.writeByte(0);
          out.writeByte(0);
          out.writeByte(0);
          out.writeByte(0);
          out.writeByte(255);
          out.writeByte(255);
          out.writeByte(255);
          out.writeString(",");
          out.writeShort(0);
          out.writeShort(0);
          out.writeShort(_width);
          out.writeShort(_height);
          out.writeByte(0);
          var lzwMinCodeSize = 2;
          var raster = getLZWRaster(lzwMinCodeSize);
          out.writeByte(lzwMinCodeSize);
          var offset = 0;
          while (raster.length - offset > 255) {
            out.writeByte(255);
            out.writeBytes(raster, offset, 255);
            offset += 255;
          }
          out.writeByte(raster.length - offset);
          out.writeBytes(raster, offset, raster.length - offset);
          out.writeByte(0);
          out.writeString(";");
        };
        var bitOutputStream = function(out) {
          var _out = out;
          var _bitLength = 0;
          var _bitBuffer = 0;
          var _this2 = {};
          _this2.write = function(data, length) {
            if (data >>> length != 0) {
              throw "length over";
            }
            while (_bitLength + length >= 8) {
              _out.writeByte(255 & (data << _bitLength | _bitBuffer));
              length -= 8 - _bitLength;
              data >>>= 8 - _bitLength;
              _bitBuffer = 0;
              _bitLength = 0;
            }
            _bitBuffer = data << _bitLength | _bitBuffer;
            _bitLength = _bitLength + length;
          };
          _this2.flush = function() {
            if (_bitLength > 0) {
              _out.writeByte(_bitBuffer);
            }
          };
          return _this2;
        };
        var getLZWRaster = function(lzwMinCodeSize) {
          var clearCode = 1 << lzwMinCodeSize;
          var endCode = (1 << lzwMinCodeSize) + 1;
          var bitLength = lzwMinCodeSize + 1;
          var table = lzwTable();
          for (var i = 0; i < clearCode; i += 1) {
            table.add(String.fromCharCode(i));
          }
          table.add(String.fromCharCode(clearCode));
          table.add(String.fromCharCode(endCode));
          var byteOut = byteArrayOutputStream();
          var bitOut = bitOutputStream(byteOut);
          bitOut.write(clearCode, bitLength);
          var dataIndex = 0;
          var s = String.fromCharCode(_data[dataIndex]);
          dataIndex += 1;
          while (dataIndex < _data.length) {
            var c = String.fromCharCode(_data[dataIndex]);
            dataIndex += 1;
            if (table.contains(s + c)) {
              s = s + c;
            } else {
              bitOut.write(table.indexOf(s), bitLength);
              if (table.size() < 4095) {
                if (table.size() == 1 << bitLength) {
                  bitLength += 1;
                }
                table.add(s + c);
              }
              s = c;
            }
          }
          bitOut.write(table.indexOf(s), bitLength);
          bitOut.write(endCode, bitLength);
          bitOut.flush();
          return byteOut.toByteArray();
        };
        var lzwTable = function() {
          var _map = {};
          var _size = 0;
          var _this2 = {};
          _this2.add = function(key) {
            if (_this2.contains(key)) {
              throw "dup key:" + key;
            }
            _map[key] = _size;
            _size += 1;
          };
          _this2.size = function() {
            return _size;
          };
          _this2.indexOf = function(key) {
            return _map[key];
          };
          _this2.contains = function(key) {
            return typeof _map[key] != "undefined";
          };
          return _this2;
        };
        return _this;
      };
      var createDataURL = function(width, height, getPixel) {
        var gif = gifImage(width, height);
        for (var y = 0; y < height; y += 1) {
          for (var x = 0; x < width; x += 1) {
            gif.setPixel(x, y, getPixel(x, y));
          }
        }
        var b = byteArrayOutputStream();
        gif.write(b);
        var base64 = base64EncodeOutputStream();
        var bytes = b.toByteArray();
        for (var i = 0; i < bytes.length; i += 1) {
          base64.writeByte(bytes[i]);
        }
        base64.flush();
        return "data:image/gif;base64," + base64;
      };
      return qrcode3;
    })();
    !(function() {
      qrcode2.stringToBytesFuncs["UTF-8"] = function(s) {
        function toUTF8Array(str) {
          var utf8 = [];
          for (var i = 0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 128) utf8.push(charcode);
            else if (charcode < 2048) {
              utf8.push(
                192 | charcode >> 6,
                128 | charcode & 63
              );
            } else if (charcode < 55296 || charcode >= 57344) {
              utf8.push(
                224 | charcode >> 12,
                128 | charcode >> 6 & 63,
                128 | charcode & 63
              );
            } else {
              i++;
              charcode = 65536 + ((charcode & 1023) << 10 | str.charCodeAt(i) & 1023);
              utf8.push(
                240 | charcode >> 18,
                128 | charcode >> 12 & 63,
                128 | charcode >> 6 & 63,
                128 | charcode & 63
              );
            }
          }
          return utf8;
        }
        return toUTF8Array(s);
      };
    })();
    (function(factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof exports === "object") {
        module.exports = factory();
      }
    })(function() {
      return qrcode2;
    });
  }
});

// src/worker/lib/http.js
var BASE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow"
};
var CSP = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
function ok(data) {
  return json({ ok: true, data });
}
function fail(code, message, status = 400) {
  return json({ ok: false, code, message }, status);
}
function htmlPage(body, { status = 200, cache = "no-cache" } = {}) {
  return new Response(body, {
    status,
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": cache,
      "Content-Security-Policy": CSP
    }
  });
}
function svgImage(body, { cache = "public, max-age=86400" } = {}) {
  return new Response(body, {
    status: 200,
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": cache
    }
  });
}
function text(body, { contentType = "text/plain; charset=utf-8", cache = "public, max-age=86400" } = {}) {
  return new Response(body, {
    status: 200,
    headers: { ...BASE_HEADERS, "Content-Type": contentType, "Cache-Control": cache }
  });
}
function redirect(location, { status = 302 } = {}) {
  return new Response(null, {
    status,
    headers: { ...BASE_HEADERS, Location: location, "Cache-Control": "no-store" }
  });
}

// src/worker/lib/kv.js
var SITE_KEY = "site";
var kvInstance = null;
function kv(env) {
  if (!kvInstance) {
    kvInstance = new EdgeKV({ namespace: env.KV_NAMESPACE || "movecar" });
  }
  return kvInstance;
}
async function readJson(env, key) {
  const raw = await kv(env).get(key, { type: "text" });
  if (raw === void 0 || raw === null || raw === "") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function writeJson(env, key, value) {
  await kv(env).put(key, JSON.stringify(value));
}
function emptySite(id) {
  return {
    id,
    title: "\u4E34\u65F6\u505C\u8F66\uFF0C\u9700\u632A\u8F66\u8BF7\u8054\u7CFB\u6211",
    notice: "\u626B\u7801\u540E\u53EF\u4E00\u952E\u547C\u53EB\uFF0C\u611F\u8C22\u914D\u5408",
    rev: 0,
    updatedAt: Date.now(),
    cars: []
  };
}
async function readSite(env) {
  return readJson(env, SITE_KEY);
}
async function writeSite(env, site) {
  await writeJson(env, SITE_KEY, site);
}
async function saveSite(env, next, expectedRev) {
  const current = await readSite(env);
  if (current) {
    if (expectedRev !== void 0 && expectedRev !== null && Number(expectedRev) !== current.rev) {
      return { ok: false, conflict: true };
    }
    next.rev = (current.rev || 0) + 1;
  } else {
    next.rev = 1;
  }
  next.updatedAt = Date.now();
  await writeSite(env, next);
  return { ok: true, site: next };
}
function newPageId() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < bytes.length; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}

// src/worker/lib/layout.js
function documentShell({ title, css, script, bodyClass, body, cache = "no-cache" }) {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="format-detection" content="telephone=no">
<meta name="theme-color" content="#1677ff">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body class="${bodyClass}">
${body}
<script>${script}<\/script>
</body>
</html>`;
  return htmlPage(html, { cache });
}
function escapeHtml(input) {
  return String(input == null ? "" : input).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function safeJsonForScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

// src/worker/views/park.js
var CALL_ICON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
<path d="M6.6 3.5a2 2 0 0 1 2.3.9l1.2 2a2 2 0 0 1-.4 2.5l-.7.6a12.5 12.5 0 0 0 5.5 5.5l.6-.7a2 2 0 0 1 2.5-.4l2 1.2a2 2 0 0 1 .9 2.3l-.5 1.7a2.5 2.5 0 0 1-2.6 1.8C10.2 20.4 3.6 13.8 3.1 6.6A2.5 2.5 0 0 1 4.9 4l1.7-.5Z" fill="currentColor"/>
</svg>`;
function carMeta(car) {
  return [car.color, car.model].filter(Boolean).join(" \xB7 ");
}
function renderParkBody(page) {
  const cars = (page.cars || []).filter((c) => c.enabled).sort((a, b) => (a.sort || 0) - (b.sort || 0));
  if (!cars.length) return renderEmptyBody(page, "\u6682\u65E0\u53EF\u7528\u8F66\u8F86");
  const single = cars.length === 1;
  const carNodes = cars.map((car, i) => {
    if (single) {
      return `<div class="car car-static">
  <span class="car-text">
    <span class="car-plate">${escapeHtml(car.plate)}</span>
    ${carMeta(car) ? `<span class="car-meta">${escapeHtml(carMeta(car))}</span>` : ""}
  </span>
</div>`;
    }
    return `<button type="button" class="car" role="radio" aria-checked="${i === 0 ? "true" : "false"}" data-car-id="${escapeHtml(car.id)}">
  <span class="car-text">
    <span class="car-plate">${escapeHtml(car.plate)}</span>
    ${carMeta(car) ? `<span class="car-meta">${escapeHtml(carMeta(car))}</span>` : ""}
  </span>
  <span class="car-check" aria-hidden="true"></span>
</button>`;
  }).join("");
  return `<main class="park">
  <header class="park-hero">
    <span class="park-badge">\u632A\u8F66\u7801</span>
    <h1>${escapeHtml(page.title)}</h1>
    ${page.notice ? `<p>${escapeHtml(page.notice)}</p>` : ""}
  </header>

  ${single ? `<div class="park-cars">${carNodes}</div>` : `<div class="park-cars" role="radiogroup" aria-label="\u9009\u62E9\u8981\u8054\u7CFB\u7684\u8F66\u8F86">${carNodes}</div>`}

  <div class="park-actions">
    <button type="button" class="call-btn" id="callBtn" data-page-id="${escapeHtml(page.id)}">
      ${CALL_ICON}<span id="callLabel">\u4E00\u952E\u547C\u53EB\u8F66\u4E3B</span>
    </button>
    <p class="park-hint">\u70B9\u51FB\u540E\u76F4\u63A5\u62E8\u6253\u8F66\u4E3B\u7535\u8BDD\uFF0C\u8BF7\u52FF\u91CD\u590D\u62E8\u6253</p>
  </div>

  <p class="park-foot">\u672C\u4E8C\u7EF4\u7801\u7531\u8F66\u4E3B\u672C\u4EBA\u8D34\u7F6E\u4E8E\u8F66\u5185<br>\u5982\u975E\u632A\u8F66\u9700\u8981\uFF0C\u8BF7\u52FF\u6253\u6270</p>
</main>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script id="parkState" type="application/json">${safeJsonForScript({
    pageId: page.id,
    cars: cars.map((c) => ({ id: c.id, plate: c.plate }))
  })}<\/script>`;
}
function renderEmptyBody(page, message) {
  return `<main class="park">
  <div class="state">
    <div class="state-icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>
      </svg>
    </div>
    <h2>${escapeHtml(message)}</h2>
    <p>\u8BE5\u632A\u8F66\u7801\u5F53\u524D\u4E0D\u53EF\u7528\u3002\u82E5\u60A8\u786E\u5B9E\u9700\u8981\u632A\u8F66\uFF0C\u8BF7\u8054\u7CFB\u505C\u8F66\u573A\u7BA1\u7406\u4EBA\u5458\u534F\u52A9\u3002</p>
  </div>
</main>`;
}
function renderNotFoundBody() {
  return `<main class="park">
  <div class="state">
    <div class="state-icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <path d="M4 7h16v13H4z"/><path d="M4 7l8 6 8-6"/>
      </svg>
    </div>
    <h2>\u632A\u8F66\u7801\u65E0\u6548</h2>
    <p>\u94FE\u63A5\u53EF\u80FD\u5DF2\u5931\u6548\u6216\u4E8C\u7EF4\u7801\u6709\u8BEF\uFF0C\u8BF7\u6838\u5BF9\u540E\u91CD\u8BD5\u3002</p>
  </div>
</main>`;
}

// src/shared/qr.js
var import_qrcode_generator = __toESM(require_qrcode(), 1);
function qrMatrix(text2, ecc = "H") {
  const qr = (0, import_qrcode_generator.default)(0, ecc);
  qr.addData(text2);
  qr.make();
  const n = qr.getModuleCount();
  const rows = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) row.push(qr.isDark(r, c));
    rows.push(row);
  }
  return rows;
}
var fmt = (v) => Math.round(v * 1e3) / 1e3;
function inFinder(r, c, n) {
  const top = r <= 6;
  const bottom = r >= n - 7;
  const left = c <= 6;
  const right = c >= n - 7;
  return top && left || top && right || bottom && left;
}
function renderQrSvg(text2, options = {}) {
  const {
    pixelSize = 512,
    style = "dot",
    dark = "#111111",
    light = "#ffffff",
    ecc = "H",
    ariaLabel = "\u8F66\u8F86\u632A\u8F66\u4E8C\u7EF4\u7801"
  } = options;
  const matrix = qrMatrix(text2, ecc);
  const n = matrix.length;
  const VB = 120;
  const square = 72;
  const offset = (VB - square) / 2;
  const cell = square / n;
  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" width="${pixelSize}" height="${pixelSize}" role="img" aria-label="${ariaLabel}">`
  );
  parts.push(`<circle cx="60" cy="60" r="60" fill="${light}"/>`);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c] || inFinder(r, c, n)) continue;
      const x = offset + c * cell;
      const y = offset + r * cell;
      if (style === "square") {
        parts.push(
          `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(cell)}" height="${fmt(cell)}" fill="${dark}"/>`
        );
      } else {
        parts.push(
          `<circle cx="${fmt(x + cell / 2)}" cy="${fmt(y + cell / 2)}" r="${fmt(cell * 0.48)}" fill="${dark}"/>`
        );
      }
    }
  }
  const finderOrigins = [
    [0, 0],
    [0, n - 7],
    [n - 7, 0]
  ];
  for (const [fr, fc] of finderOrigins) {
    const x = offset + fc * cell;
    const y = offset + fr * cell;
    parts.push(`<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(cell * 7)}" height="${fmt(cell * 7)}" rx="${fmt(cell * 1.6)}" fill="${dark}"/>`);
    parts.push(`<rect x="${fmt(x + cell)}" y="${fmt(y + cell)}" width="${fmt(cell * 5)}" height="${fmt(cell * 5)}" rx="${fmt(cell * 1.1)}" fill="${light}"/>`);
    parts.push(`<rect x="${fmt(x + cell * 2)}" y="${fmt(y + cell * 2)}" width="${fmt(cell * 3)}" height="${fmt(cell * 3)}" rx="${fmt(cell * 0.9)}" fill="${dark}"/>`);
  }
  parts.push("</svg>");
  return parts.join("");
}

// src/worker/generated/assets.js
var CSS = ':root {\n  --brand: #1677ff;\n  --brand-strong: #0958d9;\n  --call: #16a34a;\n  --call-strong: #15803d;\n  --ink: #1a1a1a;\n  --ink-2: #5c6470;\n  --ink-3: #8b94a3;\n  --bg: #f2f4f7;\n  --surface: #ffffff;\n  --line: #e6e9ef;\n  --danger: #d92d20;\n  --radius: 16px;\n  --shadow: 0 1px 2px rgba(16, 24, 40, .06), 0 8px 24px rgba(16, 24, 40, .06);\n  --safe-b: env(safe-area-inset-bottom, 0px);\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    --ink: #f2f4f7;\n    --ink-2: #a7b0be;\n    --ink-3: #7b8494;\n    --bg: #101319;\n    --surface: #181d25;\n    --line: #262c36;\n    --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 8px 24px rgba(0, 0, 0, .3);\n  }\n}\n\n* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }\n\nhtml, body { height: 100%; }\n\nbody {\n  margin: 0;\n  background: var(--bg);\n  color: var(--ink);\n  font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;\n  -webkit-font-smoothing: antialiased;\n  text-rendering: optimizeLegibility;\n}\n\nbutton { font: inherit; color: inherit; }\n\n/* ============================ \u626B\u7801\u9875 ============================ */\n\n.park-body {\n  display: flex;\n  justify-content: center;\n  min-height: 100%;\n  background:\n    radial-gradient(1200px 400px at 50% -200px, rgba(22, 119, 255, .16), transparent 70%),\n    var(--bg);\n}\n\n.park {\n  width: 100%;\n  max-width: 460px;\n  padding: 28px 18px calc(28px + var(--safe-b));\n  display: flex;\n  flex-direction: column;\n  gap: 18px;\n}\n\n.park-hero { text-align: center; padding: 8px 8px 0; }\n\n.park-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  height: 26px;\n  padding: 0 12px;\n  border-radius: 999px;\n  background: rgba(22, 119, 255, .12);\n  color: var(--brand-strong);\n  font-size: 12px;\n  font-weight: 600;\n  letter-spacing: .04em;\n}\n\n@media (prefers-color-scheme: dark) {\n  .park-badge { color: #6ba6ff; }\n}\n\n.park-hero h1 {\n  margin: 14px 0 8px;\n  font-size: 22px;\n  line-height: 1.4;\n  font-weight: 700;\n  letter-spacing: -.01em;\n}\n\n.park-hero p {\n  margin: 0;\n  color: var(--ink-2);\n  font-size: 14px;\n  line-height: 1.6;\n}\n\n.park-cars {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.car {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  width: 100%;\n  padding: 16px 16px;\n  border: 1.5px solid var(--line);\n  border-radius: var(--radius);\n  background: var(--surface);\n  box-shadow: var(--shadow);\n  text-align: left;\n  cursor: pointer;\n  transition: border-color .16s, transform .16s, box-shadow .16s;\n}\n\n.car:active { transform: scale(.985); }\n\n.car[aria-checked="true"] {\n  border-color: var(--brand);\n  box-shadow: 0 0 0 3px rgba(22, 119, 255, .16), var(--shadow);\n}\n\n.car-plate {\n  font-size: 18px;\n  font-weight: 700;\n  letter-spacing: .06em;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n\n.car-meta {\n  color: var(--ink-3);\n  font-size: 13px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.car-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }\n\n.car-static { cursor: default; }\n.car-static:active { transform: none; }\n\n.car-check {\n  flex: 0 0 22px;\n  width: 22px;\n  height: 22px;\n  border-radius: 50%;\n  border: 1.5px solid var(--line);\n  position: relative;\n}\n\n.car[aria-checked="true"] .car-check {\n  border-color: var(--brand);\n  background: var(--brand);\n}\n\n.car[aria-checked="true"] .car-check::after {\n  content: "";\n  position: absolute;\n  left: 7px;\n  top: 3px;\n  width: 5px;\n  height: 10px;\n  border: solid #fff;\n  border-width: 0 2px 2px 0;\n  transform: rotate(45deg);\n}\n\n.park-actions { margin-top: auto; padding-top: 6px; }\n\n.call-btn {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n  width: 100%;\n  height: 58px;\n  border: 0;\n  border-radius: 999px;\n  background: linear-gradient(180deg, #1fbb62, var(--call));\n  color: #fff;\n  font-size: 18px;\n  font-weight: 700;\n  letter-spacing: .04em;\n  box-shadow: 0 10px 24px rgba(22, 163, 74, .32);\n  cursor: pointer;\n  transition: transform .14s, box-shadow .14s, opacity .14s;\n}\n\n.call-btn:active { transform: scale(.98); box-shadow: 0 6px 16px rgba(22, 163, 74, .3); }\n.call-btn[disabled] { opacity: .6; cursor: default; transform: none; }\n\n.call-btn svg { width: 22px; height: 22px; flex: 0 0 22px; }\n\n.park-hint {\n  margin: 12px 0 0;\n  text-align: center;\n  color: var(--ink-3);\n  font-size: 12.5px;\n  line-height: 1.6;\n}\n\n.park-foot {\n  margin-top: 4px;\n  text-align: center;\n  color: var(--ink-3);\n  font-size: 11.5px;\n  line-height: 1.7;\n}\n\n/* \u5931\u6548 / \u7A7A\u72B6\u6001 */\n.state {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 10px;\n  padding: 56px 16px;\n  text-align: center;\n}\n\n.state-icon {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  display: grid;\n  place-items: center;\n  background: var(--surface);\n  box-shadow: var(--shadow);\n  color: var(--ink-3);\n}\n\n.state h2 { margin: 6px 0 0; font-size: 17px; }\n.state p { margin: 0; color: var(--ink-2); font-size: 13.5px; line-height: 1.7; max-width: 260px; }\n\n/* Toast */\n.toast {\n  position: fixed;\n  left: 50%;\n  bottom: calc(96px + var(--safe-b));\n  transform: translate(-50%, 12px);\n  max-width: 84vw;\n  padding: 11px 18px;\n  border-radius: 999px;\n  background: rgba(24, 26, 32, .92);\n  color: #fff;\n  font-size: 13.5px;\n  line-height: 1.4;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity .2s, transform .2s;\n  z-index: 50;\n}\n\n.toast.show { opacity: 1; transform: translate(-50%, 0); }\n\n/* ============================ \u540E\u53F0 ============================ */\n\n.admin-body {\n  min-height: 100%;\n  background: var(--bg);\n}\n\n.auth {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  padding: 24px 18px;\n}\n\n.auth-card {\n  width: 100%;\n  max-width: 380px;\n  padding: 30px 26px 26px;\n  border-radius: 20px;\n  background: var(--surface);\n  box-shadow: var(--shadow);\n}\n\n.auth-logo {\n  width: 46px;\n  height: 46px;\n  border-radius: 13px;\n  display: grid;\n  place-items: center;\n  background: var(--brand);\n  color: #fff;\n  font-size: 20px;\n  font-weight: 800;\n  margin-bottom: 18px;\n}\n\n.auth-card h1 { margin: 0 0 6px; font-size: 20px; letter-spacing: -.01em; }\n.auth-card .sub { margin: 0 0 22px; color: var(--ink-2); font-size: 13.5px; line-height: 1.6; }\n\n.field { margin-bottom: 14px; }\n.field label {\n  display: block;\n  margin-bottom: 7px;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--ink-2);\n}\n\n.input {\n  width: 100%;\n  height: 46px;\n  padding: 0 14px;\n  border: 1.5px solid var(--line);\n  border-radius: 11px;\n  background: var(--surface);\n  color: var(--ink);\n  font-size: 15px;\n  outline: none;\n  transition: border-color .15s, box-shadow .15s;\n}\n\ntextarea.input { height: auto; padding: 12px 14px; line-height: 1.6; resize: vertical; }\n\n.input:focus {\n  border-color: var(--brand);\n  box-shadow: 0 0 0 3px rgba(22, 119, 255, .14);\n}\n\n.btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 7px;\n  height: 46px;\n  padding: 0 20px;\n  border: 0;\n  border-radius: 11px;\n  background: var(--brand);\n  color: #fff;\n  font-size: 15px;\n  font-weight: 600;\n  white-space: nowrap;\n  cursor: pointer;\n  transition: background .15s, transform .12s, opacity .15s;\n}\n\n.btn svg { width: 16px; height: 16px; flex: 0 0 16px; }\n\n.btn:active { transform: scale(.985); }\n.btn[disabled] { opacity: .55; cursor: default; }\n.btn-block { width: 100%; }\n.btn-ghost { background: transparent; color: var(--ink-2); border: 1.5px solid var(--line); }\n.btn-ghost:hover { color: var(--ink); }\n.btn-danger { background: var(--danger); }\n.btn-sm { height: 36px; padding: 0 14px; font-size: 13px; border-radius: 9px; }\n\n.alert {\n  margin-bottom: 14px;\n  padding: 10px 13px;\n  border-radius: 10px;\n  background: rgba(217, 45, 32, .1);\n  color: var(--danger);\n  font-size: 13px;\n  line-height: 1.5;\n}\n\n.alert[hidden] { display: none; }\n\n/* \u540E\u53F0\u5916\u58F3 */\n.shell { max-width: 1080px; margin: 0 auto; padding: 22px 18px 90px; }\n\n.topbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 20px;\n}\n\n.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }\n.brand-mark {\n  width: 34px; height: 34px; border-radius: 10px;\n  background: var(--brand); color: #fff;\n  display: grid; place-items: center; font-weight: 800; font-size: 15px;\n  flex: 0 0 34px;\n}\n.brand h1 { margin: 0; font-size: 16px; font-weight: 700; }\n.brand p { margin: 2px 0 0; font-size: 12px; color: var(--ink-3); }\n\n.tabs {\n  display: flex;\n  gap: 4px;\n  padding: 4px;\n  margin-bottom: 18px;\n  border-radius: 12px;\n  background: var(--surface);\n  box-shadow: var(--shadow);\n  overflow-x: auto;\n  scrollbar-width: none;\n}\n.tabs::-webkit-scrollbar { display: none; }\n\n.tab {\n  flex: 1 0 auto;\n  height: 38px;\n  padding: 0 16px;\n  border: 0;\n  border-radius: 9px;\n  background: transparent;\n  color: var(--ink-2);\n  font-size: 13.5px;\n  font-weight: 600;\n  white-space: nowrap;\n  cursor: pointer;\n}\n\n.tab[aria-selected="true"] { background: var(--brand); color: #fff; }\n\n.panel { display: none; }\n.panel.active { display: block; animation: fade .18s ease; }\n\n@keyframes fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }\n\n.card {\n  padding: 18px;\n  border-radius: var(--radius);\n  background: var(--surface);\n  box-shadow: var(--shadow);\n  margin-bottom: 14px;\n}\n\n.card-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 14px;\n}\n\n.card-head h2 { margin: 0; font-size: 15px; font-weight: 700; }\n.card-head .desc { margin: 3px 0 0; font-size: 12.5px; color: var(--ink-3); }\n\n.muted { color: var(--ink-3); font-size: 12.5px; line-height: 1.6; }\n\n/* \u8F66\u8F86\u5217\u8868 */\n.car-row {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  padding: 14px 0;\n  border-bottom: 1px solid var(--line);\n}\n.car-row:last-child { border-bottom: 0; padding-bottom: 0; }\n\n.car-row-main { flex: 1; min-width: 0; }\n.car-row-plate {\n  font-size: 15.5px;\n  font-weight: 700;\n  letter-spacing: .05em;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.car-row-sub {\n  margin-top: 3px;\n  font-size: 12.5px;\n  color: var(--ink-3);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--call); flex: 0 0 6px; }\n.dot.off { background: var(--ink-3); }\n\n.car-row-ops { display: flex; gap: 6px; flex: 0 0 auto; }\n\n.icon-btn {\n  width: 34px; height: 34px;\n  display: grid; place-items: center;\n  border: 1.5px solid var(--line);\n  border-radius: 9px;\n  background: transparent;\n  color: var(--ink-2);\n  cursor: pointer;\n}\n.icon-btn:hover { color: var(--ink); border-color: var(--ink-3); }\n.icon-btn.danger:hover { color: var(--danger); border-color: var(--danger); }\n.icon-btn svg { width: 16px; height: 16px; }\n\n.empty {\n  padding: 34px 10px;\n  text-align: center;\n  color: var(--ink-3);\n  font-size: 13.5px;\n  line-height: 1.7;\n}\n\n/* \u4E8C\u7EF4\u7801\u533A */\n.qr-wrap {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 22px;\n  align-items: center;\n}\n\n.qr-canvas {\n  width: 200px;\n  height: 200px;\n  flex: 0 0 200px;\n  border-radius: 50%;\n  background: #fff;\n  padding: 0;\n  box-shadow: 0 0 0 1px var(--line), var(--shadow);\n  overflow: hidden;\n}\n\n.qr-canvas svg { display: block; width: 100%; height: 100%; }\n\n.qr-side { flex: 1 1 220px; min-width: 0; }\n.qr-link {\n  display: block;\n  padding: 10px 12px;\n  margin: 10px 0 14px;\n  border-radius: 9px;\n  background: var(--bg);\n  color: var(--ink-2);\n  font-size: 12.5px;\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  word-break: break-all;\n  line-height: 1.5;\n}\n\n.btn-row { display: flex; flex-wrap: wrap; gap: 8px; }\n\n/* \u5F39\u5C42 */\n.modal {\n  position: fixed;\n  inset: 0;\n  z-index: 100;\n  display: grid;\n  place-items: center;\n  padding: 18px;\n  background: rgba(12, 16, 22, .5);\n  backdrop-filter: blur(3px);\n}\n\n.modal[hidden] { display: none; }\n\n.modal-card {\n  width: 100%;\n  max-width: 460px;\n  max-height: 88vh;\n  overflow-y: auto;\n  padding: 20px;\n  border-radius: 18px;\n  background: var(--surface);\n  box-shadow: 0 24px 60px rgba(0, 0, 0, .3);\n  animation: pop .18s ease;\n}\n\n@keyframes pop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }\n\n.modal-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 16px;\n}\n.modal-head h2 { margin: 0; font-size: 16px; }\n\n.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }\n\n.switch-row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 12px 0;\n  border-top: 1px solid var(--line);\n  margin-top: 4px;\n}\n\n.switch { position: relative; width: 44px; height: 26px; flex: 0 0 44px; }\n.switch input { position: absolute; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }\n.switch span {\n  position: absolute; inset: 0; border-radius: 999px; background: var(--line);\n  transition: background .18s; pointer-events: none;\n}\n.switch span::after {\n  content: ""; position: absolute; top: 3px; left: 3px;\n  width: 20px; height: 20px; border-radius: 50%; background: #fff;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, .2); transition: transform .18s;\n}\n.switch input:checked + span { background: var(--call); }\n.switch input:checked + span::after { transform: translateX(18px); }\n\n.modal-foot {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n  margin-top: 20px;\n}\n\n/* \u6253\u5370\u5361\u7247 */\n.print-sheet { display: none; }\n\n@media print {\n  body { background: #fff; }\n  .shell, .toast, .modal { display: none !important; }\n  .print-sheet {\n    display: flex !important;\n    flex-direction: column;\n    align-items: center;\n    justify-content: center;\n    gap: 14px;\n    width: 105mm;\n    height: 148mm;\n    margin: 0 auto;\n    padding: 12mm;\n    border: 1px dashed #ccc;\n    text-align: center;\n  }\n  .print-sheet .p-qr { width: 72mm; height: 72mm; }\n  .print-sheet .p-qr svg { width: 100%; height: 100%; }\n  .print-sheet .p-plate { font-size: 20pt; font-weight: 800; letter-spacing: .1em; }\n  .print-sheet .p-tip { font-size: 11pt; color: #444; line-height: 1.6; }\n  .print-sheet .p-foot { font-size: 8pt; color: #888; }\n}\n\n@media (max-width: 560px) {\n  .shell { padding: 16px 14px 80px; }\n  .qr-wrap { justify-content: center; }\n  .qr-canvas { width: 180px; height: 180px; flex-basis: 180px; }\n  .row-2 { grid-template-columns: 1fr; }\n  .tabs { position: sticky; top: 0; z-index: 10; }\n}\n';
var PARK_JS = `(()=>{(function(){"use strict";var g=document.getElementById("parkState");if(!g)return;var s;try{s=JSON.parse(g.textContent||"{}")}catch(t){return}var o=s.cars||[];if(!o.length)return;var d=(o.length===1,o[0].id),c=document.getElementById("callBtn"),a=document.getElementById("callLabel"),l=document.getElementById("toast"),h=null,u=!1;function v(t){l&&(l.textContent=t,l.classList.add("show"),clearTimeout(h),h=setTimeout(function(){l.classList.remove("show")},2600))}for(var r=document.querySelectorAll(".car[data-car-id]"),f=0;f<r.length;f++)r[f].addEventListener("click",function(){d=this.getAttribute("data-car-id");for(var t=0;t<r.length;t++)r[t].setAttribute("aria-checked",r[t]===this?"true":"false")});function b(t){return!t||t.length<7?t||"":t.slice(0,3)+"****"+t.slice(-4)}function y(t){return fetch("/api/p/"+encodeURIComponent(s.pageId)+"/contact",{method:"POST",headers:{"Content-Type":"application/json","X-Requested-With":"fetch"},body:JSON.stringify({carId:t}),credentials:"omit",cache:"no-store"}).then(function(e){return e.json().then(function(n){if(!e.ok||!n.ok){var i=new Error(n&&n.message||"\\u83B7\\u53D6\\u53F7\\u7801\\u5931\\u8D25");throw i.code=n&&n.code,i}return n.data})})}function x(t){window.location.href="tel:"+t}function k(t){var e=document.createElement("div");e.className="modal",e.innerHTML='<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="cfmTitle" style="max-width:340px;text-align:center"><h2 id="cfmTitle" style="margin:4px 0 8px;font-size:17px">\\u786E\\u8BA4\\u62E8\\u6253\\u7535\\u8BDD</h2><p style="margin:0 0 4px;color:var(--ink-2);font-size:13.5px">\\u5373\\u5C06\\u62E8\\u6253</p><p style="margin:0 0 18px;font-size:22px;font-weight:700;letter-spacing:.04em;font-variant-numeric:tabular-nums">'+b(t)+'</p><div style="display:flex;gap:10px"><button type="button" class="btn btn-ghost" data-act="cancel" style="flex:1">\\u53D6\\u6D88</button><button type="button" class="btn" data-act="ok" style="flex:1;background:var(--call)">\\u547C\\u53EB</button></div></div>',document.body.appendChild(e);function n(){e.parentNode&&e.parentNode.removeChild(e)}e.addEventListener("click",function(m){var p=m.target.getAttribute&&m.target.getAttribute("data-act");p==="ok"?(n(),x(t)):(p==="cancel"||m.target===e)&&n()});var i=e.querySelector('[data-act="ok"]');i&&i.focus()}c&&c.addEventListener("click",function(){if(!(u||!d)){u=!0;var t=a?a.textContent:"";a&&(a.textContent="\\u6B63\\u5728\\u83B7\\u53D6\\u53F7\\u7801\\u2026"),c.setAttribute("disabled","disabled"),y(d).then(function(e){k(e.phone)}).catch(function(e){e.code==="RATE_LIMITED"?v("\\u8BF7\\u6C42\\u8FC7\\u4E8E\\u9891\\u7E41\\uFF0C\\u8BF7\\u7A0D\\u540E\\u518D\\u8BD5"):v(e.message||"\\u83B7\\u53D6\\u53F7\\u7801\\u5931\\u8D25\\uFF0C\\u8BF7\\u7A0D\\u540E\\u91CD\\u8BD5")}).then(function(){u=!1,c.removeAttribute("disabled"),a&&(a.textContent=t||"\\u4E00\\u952E\\u547C\\u53EB\\u8F66\\u4E3B")})}})})();})();
`;
var ADMIN_JS = `(()=>{var dt=Object.create;var it=Object.defineProperty;var ht=Object.getOwnPropertyDescriptor;var gt=Object.getOwnPropertyNames;var pt=Object.getPrototypeOf,wt=Object.prototype.hasOwnProperty;var xt=(x,c)=>()=>(c||x((c={exports:{}}).exports,c),c.exports);var bt=(x,c,T,A)=>{if(c&&typeof c=="object"||typeof c=="function")for(let L of gt(c))!wt.call(x,L)&&L!==T&&it(x,L,{get:()=>c[L],enumerable:!(A=ht(c,L))||A.enumerable});return x};var yt=(x,c,T)=>(T=x!=null?dt(pt(x)):{},bt(c||!x||!x.__esModule?it(T,"default",{value:x,enumerable:!0}):T,x));var st=xt((ft,ut)=>{var ot=(function(){var x=function(g,p){var r=236,a=17,e=g,f=T[p],n=null,t=0,h=null,u=[],d={},B=function(o,s){t=e*4+17,n=(function(i){for(var v=new Array(i),l=0;l<i;l+=1){v[l]=new Array(i);for(var w=0;w<i;w+=1)v[l][w]=null}return v})(t),E(0,0),E(t-7,0),E(0,t-7),N(),R(),J(o,s),e>=7&&K(o),h==null&&(h=lt(e,f,u)),q(h,s)},E=function(o,s){for(var i=-1;i<=7;i+=1)if(!(o+i<=-1||t<=o+i))for(var v=-1;v<=7;v+=1)s+v<=-1||t<=s+v||(0<=i&&i<=6&&(v==0||v==6)||0<=v&&v<=6&&(i==0||i==6)||2<=i&&i<=4&&2<=v&&v<=4?n[o+i][s+v]=!0:n[o+i][s+v]=!1)},k=function(){for(var o=0,s=0,i=0;i<8;i+=1){B(!0,i);var v=L.getLostPoint(d);(i==0||o>v)&&(o=v,s=i)}return s},R=function(){for(var o=8;o<t-8;o+=1)n[o][6]==null&&(n[o][6]=o%2==0);for(var s=8;s<t-8;s+=1)n[6][s]==null&&(n[6][s]=s%2==0)},N=function(){for(var o=L.getPatternPosition(e),s=0;s<o.length;s+=1)for(var i=0;i<o.length;i+=1){var v=o[s],l=o[i];if(n[v][l]==null)for(var w=-2;w<=2;w+=1)for(var y=-2;y<=2;y+=1)w==-2||w==2||y==-2||y==2||w==0&&y==0?n[v+w][l+y]=!0:n[v+w][l+y]=!1}},K=function(o){for(var s=L.getBCHTypeNumber(e),i=0;i<18;i+=1){var v=!o&&(s>>i&1)==1;n[Math.floor(i/3)][i%3+t-8-3]=v}for(var i=0;i<18;i+=1){var v=!o&&(s>>i&1)==1;n[i%3+t-8-3][Math.floor(i/3)]=v}},J=function(o,s){for(var i=f<<3|s,v=L.getBCHTypeInfo(i),l=0;l<15;l+=1){var w=!o&&(v>>l&1)==1;l<6?n[l][8]=w:l<8?n[l+1][8]=w:n[t-15+l][8]=w}for(var l=0;l<15;l+=1){var w=!o&&(v>>l&1)==1;l<8?n[8][t-l-1]=w:l<9?n[8][15-l-1+1]=w:n[8][15-l-1]=w}n[t-8][8]=!o},q=function(o,s){for(var i=-1,v=t-1,l=7,w=0,y=L.getMaskFunction(s),b=t-1;b>0;b-=2)for(b==6&&(b-=1);;){for(var C=0;C<2;C+=1)if(n[v][b-C]==null){var I=!1;w<o.length&&(I=(o[w]>>>l&1)==1);var m=y(v,b-C);m&&(I=!I),n[v][b-C]=I,l-=1,l==-1&&(w+=1,l=7)}if(v+=i,v<0||t<=v){v-=i,i=-i;break}}},X=function(o,s){for(var i=0,v=0,l=0,w=new Array(s.length),y=new Array(s.length),b=0;b<s.length;b+=1){var C=s[b].dataCount,I=s[b].totalCount-C;v=Math.max(v,C),l=Math.max(l,I),w[b]=new Array(C);for(var m=0;m<w[b].length;m+=1)w[b][m]=255&o.getBuffer()[m+i];i+=C;var H=L.getErrorCorrectPolynomial(I),Q=U(w[b],H.getLength()-1),et=Q.mod(H);y[b]=new Array(H.getLength()-1);for(var m=0;m<y[b].length;m+=1){var nt=m+et.getLength()-y[b].length;y[b][m]=nt>=0?et.getAt(nt):0}}for(var at=0,m=0;m<s.length;m+=1)at+=s[m].totalCount;for(var rt=new Array(at),z=0,m=0;m<v;m+=1)for(var b=0;b<s.length;b+=1)m<w[b].length&&(rt[z]=w[b][m],z+=1);for(var m=0;m<l;m+=1)for(var b=0;b<s.length;b+=1)m<y[b].length&&(rt[z]=y[b][m],z+=1);return rt},lt=function(o,s,i){for(var v=O.getRSBlocks(o,s),l=P(),w=0;w<i.length;w+=1){var y=i[w];l.put(y.getMode(),4),l.put(y.getLength(),L.getLengthInBits(y.getMode(),o)),y.write(l)}for(var b=0,w=0;w<v.length;w+=1)b+=v[w].dataCount;if(l.getLengthInBits()>b*8)throw"code length overflow. ("+l.getLengthInBits()+">"+b*8+")";for(l.getLengthInBits()+4<=b*8&&l.put(0,4);l.getLengthInBits()%8!=0;)l.putBit(!1);for(;!(l.getLengthInBits()>=b*8||(l.put(r,8),l.getLengthInBits()>=b*8));)l.put(a,8);return X(l,v)};d.addData=function(o,s){s=s||"Byte";var i=null;switch(s){case"Numeric":i=S(o);break;case"Alphanumeric":i=G(o);break;case"Byte":i=W(o);break;case"Kanji":i=Y(o);break;default:throw"mode:"+s}u.push(i),h=null},d.isDark=function(o,s){if(o<0||t<=o||s<0||t<=s)throw o+","+s;return n[o][s]},d.getModuleCount=function(){return t},d.make=function(){if(e<1){for(var o=1;o<40;o++){for(var s=O.getRSBlocks(o,f),i=P(),v=0;v<u.length;v++){var l=u[v];i.put(l.getMode(),4),i.put(l.getLength(),L.getLengthInBits(l.getMode(),o)),l.write(i)}for(var w=0,v=0;v<s.length;v++)w+=s[v].dataCount;if(i.getLengthInBits()<=w*8)break}e=o}B(!1,k())},d.createTableTag=function(o,s){o=o||2,s=typeof s=="undefined"?o*4:s;var i="";i+='<table style="',i+=" border-width: 0px; border-style: none;",i+=" border-collapse: collapse;",i+=" padding: 0px; margin: "+s+"px;",i+='">',i+="<tbody>";for(var v=0;v<d.getModuleCount();v+=1){i+="<tr>";for(var l=0;l<d.getModuleCount();l+=1)i+='<td style="',i+=" border-width: 0px; border-style: none;",i+=" border-collapse: collapse;",i+=" padding: 0px; margin: 0px;",i+=" width: "+o+"px;",i+=" height: "+o+"px;",i+=" background-color: ",i+=d.isDark(v,l)?"#000000":"#ffffff",i+=";",i+='"/>';i+="</tr>"}return i+="</tbody>",i+="</table>",i},d.createSvgTag=function(o,s,i,v){var l={};typeof arguments[0]=="object"&&(l=arguments[0],o=l.cellSize,s=l.margin,i=l.alt,v=l.title),o=o||2,s=typeof s=="undefined"?o*4:s,i=typeof i=="string"?{text:i}:i||{},i.text=i.text||null,i.id=i.text?i.id||"qrcode-description":null,v=typeof v=="string"?{text:v}:v||{},v.text=v.text||null,v.id=v.text?v.id||"qrcode-title":null;var w=d.getModuleCount()*o+s*2,y,b,C,I,m="",H;for(H="l"+o+",0 0,"+o+" -"+o+",0 0,-"+o+"z ",m+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',m+=l.scalable?"":' width="'+w+'px" height="'+w+'px"',m+=' viewBox="0 0 '+w+" "+w+'" ',m+=' preserveAspectRatio="xMinYMin meet"',m+=v.text||i.text?' role="img" aria-labelledby="'+Z([v.id,i.id].join(" ").trim())+'"':"",m+=">",m+=v.text?'<title id="'+Z(v.id)+'">'+Z(v.text)+"</title>":"",m+=i.text?'<description id="'+Z(i.id)+'">'+Z(i.text)+"</description>":"",m+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',m+='<path d="',C=0;C<d.getModuleCount();C+=1)for(I=C*o+s,y=0;y<d.getModuleCount();y+=1)d.isDark(C,y)&&(b=y*o+s,m+="M"+b+","+I+H);return m+='" stroke="transparent" fill="black"/>',m+="</svg>",m},d.createDataURL=function(o,s){o=o||2,s=typeof s=="undefined"?o*4:s;var i=d.getModuleCount()*o+s*2,v=s,l=i-s;return F(i,i,function(w,y){if(v<=w&&w<l&&v<=y&&y<l){var b=Math.floor((w-v)/o),C=Math.floor((y-v)/o);return d.isDark(C,b)?0:1}else return 1})},d.createImgTag=function(o,s,i){o=o||2,s=typeof s=="undefined"?o*4:s;var v=d.getModuleCount()*o+s*2,l="";return l+="<img",l+=' src="',l+=d.createDataURL(o,s),l+='"',l+=' width="',l+=v,l+='"',l+=' height="',l+=v,l+='"',i&&(l+=' alt="',l+=Z(i),l+='"'),l+="/>",l};var Z=function(o){for(var s="",i=0;i<o.length;i+=1){var v=o.charAt(i);switch(v){case"<":s+="&lt;";break;case">":s+="&gt;";break;case"&":s+="&amp;";break;case'"':s+="&quot;";break;default:s+=v;break}}return s},ct=function(o){var s=1;o=typeof o=="undefined"?s*2:o;var i=d.getModuleCount()*s+o*2,v=o,l=i-o,w,y,b,C,I,m={"\\u2588\\u2588":"\\u2588","\\u2588 ":"\\u2580"," \\u2588":"\\u2584","  ":" "},H={"\\u2588\\u2588":"\\u2580","\\u2588 ":"\\u2580"," \\u2588":" ","  ":" "},Q="";for(w=0;w<i;w+=2){for(b=Math.floor((w-v)/s),C=Math.floor((w+1-v)/s),y=0;y<i;y+=1)I="\\u2588",v<=y&&y<l&&v<=w&&w<l&&d.isDark(b,Math.floor((y-v)/s))&&(I=" "),v<=y&&y<l&&v<=w+1&&w+1<l&&d.isDark(C,Math.floor((y-v)/s))?I+=" ":I+="\\u2588",Q+=o<1&&w+1>=l?H[I]:m[I];Q+=\`
\`}return i%2&&o>0?Q.substring(0,Q.length-i-1)+Array(i+1).join("\\u2580"):Q.substring(0,Q.length-1)};return d.createASCII=function(o,s){if(o=o||1,o<2)return ct(s);o-=1,s=typeof s=="undefined"?o*2:s;var i=d.getModuleCount()*o+s*2,v=s,l=i-s,w,y,b,C,I=Array(o+1).join("\\u2588\\u2588"),m=Array(o+1).join("  "),H="",Q="";for(w=0;w<i;w+=1){for(b=Math.floor((w-v)/o),Q="",y=0;y<i;y+=1)C=1,v<=y&&y<l&&v<=w&&w<l&&d.isDark(b,Math.floor((y-v)/o))&&(C=0),Q+=C?I:m;for(b=0;b<o;b+=1)H+=Q+\`
\`}return H.substring(0,H.length-1)},d.renderTo2dContext=function(o,s){s=s||2;for(var i=d.getModuleCount(),v=0;v<i;v++)for(var l=0;l<i;l++)o.fillStyle=d.isDark(v,l)?"black":"white",o.fillRect(v*s,l*s,s,s)},d};x.stringToBytesFuncs={default:function(g){for(var p=[],r=0;r<g.length;r+=1){var a=g.charCodeAt(r);p.push(a&255)}return p}},x.stringToBytes=x.stringToBytesFuncs.default,x.createStringToBytes=function(g,p){var r=(function(){for(var e=V(g),f=function(){var R=e.read();if(R==-1)throw"eof";return R},n=0,t={};;){var h=e.read();if(h==-1)break;var u=f(),d=f(),B=f(),E=String.fromCharCode(h<<8|u),k=d<<8|B;t[E]=k,n+=1}if(n!=p)throw n+" != "+p;return t})(),a=63;return function(e){for(var f=[],n=0;n<e.length;n+=1){var t=e.charCodeAt(n);if(t<128)f.push(t);else{var h=r[e.charAt(n)];typeof h=="number"?(h&255)==h?f.push(h):(f.push(h>>>8),f.push(h&255)):f.push(a)}}return f}};var c={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},T={L:1,M:0,Q:3,H:2},A={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},L=(function(){var g=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],p=1335,r=7973,a=21522,e={},f=function(n){for(var t=0;n!=0;)t+=1,n>>>=1;return t};return e.getBCHTypeInfo=function(n){for(var t=n<<10;f(t)-f(p)>=0;)t^=p<<f(t)-f(p);return(n<<10|t)^a},e.getBCHTypeNumber=function(n){for(var t=n<<12;f(t)-f(r)>=0;)t^=r<<f(t)-f(r);return n<<12|t},e.getPatternPosition=function(n){return g[n-1]},e.getMaskFunction=function(n){switch(n){case A.PATTERN000:return function(t,h){return(t+h)%2==0};case A.PATTERN001:return function(t,h){return t%2==0};case A.PATTERN010:return function(t,h){return h%3==0};case A.PATTERN011:return function(t,h){return(t+h)%3==0};case A.PATTERN100:return function(t,h){return(Math.floor(t/2)+Math.floor(h/3))%2==0};case A.PATTERN101:return function(t,h){return t*h%2+t*h%3==0};case A.PATTERN110:return function(t,h){return(t*h%2+t*h%3)%2==0};case A.PATTERN111:return function(t,h){return(t*h%3+(t+h)%2)%2==0};default:throw"bad maskPattern:"+n}},e.getErrorCorrectPolynomial=function(n){for(var t=U([1],0),h=0;h<n;h+=1)t=t.multiply(U([1,M.gexp(h)],0));return t},e.getLengthInBits=function(n,t){if(1<=t&&t<10)switch(n){case c.MODE_NUMBER:return 10;case c.MODE_ALPHA_NUM:return 9;case c.MODE_8BIT_BYTE:return 8;case c.MODE_KANJI:return 8;default:throw"mode:"+n}else if(t<27)switch(n){case c.MODE_NUMBER:return 12;case c.MODE_ALPHA_NUM:return 11;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 10;default:throw"mode:"+n}else if(t<41)switch(n){case c.MODE_NUMBER:return 14;case c.MODE_ALPHA_NUM:return 13;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 12;default:throw"mode:"+n}else throw"type:"+t},e.getLostPoint=function(n){for(var t=n.getModuleCount(),h=0,u=0;u<t;u+=1)for(var d=0;d<t;d+=1){for(var B=0,E=n.isDark(u,d),k=-1;k<=1;k+=1)if(!(u+k<0||t<=u+k))for(var R=-1;R<=1;R+=1)d+R<0||t<=d+R||k==0&&R==0||E==n.isDark(u+k,d+R)&&(B+=1);B>5&&(h+=3+B-5)}for(var u=0;u<t-1;u+=1)for(var d=0;d<t-1;d+=1){var N=0;n.isDark(u,d)&&(N+=1),n.isDark(u+1,d)&&(N+=1),n.isDark(u,d+1)&&(N+=1),n.isDark(u+1,d+1)&&(N+=1),(N==0||N==4)&&(h+=3)}for(var u=0;u<t;u+=1)for(var d=0;d<t-6;d+=1)n.isDark(u,d)&&!n.isDark(u,d+1)&&n.isDark(u,d+2)&&n.isDark(u,d+3)&&n.isDark(u,d+4)&&!n.isDark(u,d+5)&&n.isDark(u,d+6)&&(h+=40);for(var d=0;d<t;d+=1)for(var u=0;u<t-6;u+=1)n.isDark(u,d)&&!n.isDark(u+1,d)&&n.isDark(u+2,d)&&n.isDark(u+3,d)&&n.isDark(u+4,d)&&!n.isDark(u+5,d)&&n.isDark(u+6,d)&&(h+=40);for(var K=0,d=0;d<t;d+=1)for(var u=0;u<t;u+=1)n.isDark(u,d)&&(K+=1);var J=Math.abs(100*K/t/t-50)/5;return h+=J*10,h},e})(),M=(function(){for(var g=new Array(256),p=new Array(256),r=0;r<8;r+=1)g[r]=1<<r;for(var r=8;r<256;r+=1)g[r]=g[r-4]^g[r-5]^g[r-6]^g[r-8];for(var r=0;r<255;r+=1)p[g[r]]=r;var a={};return a.glog=function(e){if(e<1)throw"glog("+e+")";return p[e]},a.gexp=function(e){for(;e<0;)e+=255;for(;e>=256;)e-=255;return g[e]},a})();function U(g,p){if(typeof g.length=="undefined")throw g.length+"/"+p;var r=(function(){for(var e=0;e<g.length&&g[e]==0;)e+=1;for(var f=new Array(g.length-e+p),n=0;n<g.length-e;n+=1)f[n]=g[n+e];return f})(),a={};return a.getAt=function(e){return r[e]},a.getLength=function(){return r.length},a.multiply=function(e){for(var f=new Array(a.getLength()+e.getLength()-1),n=0;n<a.getLength();n+=1)for(var t=0;t<e.getLength();t+=1)f[n+t]^=M.gexp(M.glog(a.getAt(n))+M.glog(e.getAt(t)));return U(f,0)},a.mod=function(e){if(a.getLength()-e.getLength()<0)return a;for(var f=M.glog(a.getAt(0))-M.glog(e.getAt(0)),n=new Array(a.getLength()),t=0;t<a.getLength();t+=1)n[t]=a.getAt(t);for(var t=0;t<e.getLength();t+=1)n[t]^=M.gexp(M.glog(e.getAt(t))+f);return U(n,0).mod(e)},a}var O=(function(){var g=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],p=function(e,f){var n={};return n.totalCount=e,n.dataCount=f,n},r={},a=function(e,f){switch(f){case T.L:return g[(e-1)*4+0];case T.M:return g[(e-1)*4+1];case T.Q:return g[(e-1)*4+2];case T.H:return g[(e-1)*4+3];default:return}};return r.getRSBlocks=function(e,f){var n=a(e,f);if(typeof n=="undefined")throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+f;for(var t=n.length/3,h=[],u=0;u<t;u+=1)for(var d=n[u*3+0],B=n[u*3+1],E=n[u*3+2],k=0;k<d;k+=1)h.push(p(B,E));return h},r})(),P=function(){var g=[],p=0,r={};return r.getBuffer=function(){return g},r.getAt=function(a){var e=Math.floor(a/8);return(g[e]>>>7-a%8&1)==1},r.put=function(a,e){for(var f=0;f<e;f+=1)r.putBit((a>>>e-f-1&1)==1)},r.getLengthInBits=function(){return p},r.putBit=function(a){var e=Math.floor(p/8);g.length<=e&&g.push(0),a&&(g[e]|=128>>>p%8),p+=1},r},S=function(g){var p=c.MODE_NUMBER,r=g,a={};a.getMode=function(){return p},a.getLength=function(n){return r.length},a.write=function(n){for(var t=r,h=0;h+2<t.length;)n.put(e(t.substring(h,h+3)),10),h+=3;h<t.length&&(t.length-h==1?n.put(e(t.substring(h,h+1)),4):t.length-h==2&&n.put(e(t.substring(h,h+2)),7))};var e=function(n){for(var t=0,h=0;h<n.length;h+=1)t=t*10+f(n.charAt(h));return t},f=function(n){if("0"<=n&&n<="9")return n.charCodeAt(0)-48;throw"illegal char :"+n};return a},G=function(g){var p=c.MODE_ALPHA_NUM,r=g,a={};a.getMode=function(){return p},a.getLength=function(f){return r.length},a.write=function(f){for(var n=r,t=0;t+1<n.length;)f.put(e(n.charAt(t))*45+e(n.charAt(t+1)),11),t+=2;t<n.length&&f.put(e(n.charAt(t)),6)};var e=function(f){if("0"<=f&&f<="9")return f.charCodeAt(0)-48;if("A"<=f&&f<="Z")return f.charCodeAt(0)-65+10;switch(f){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+f}};return a},W=function(g){var p=c.MODE_8BIT_BYTE,r=g,a=x.stringToBytes(g),e={};return e.getMode=function(){return p},e.getLength=function(f){return a.length},e.write=function(f){for(var n=0;n<a.length;n+=1)f.put(a[n],8)},e},Y=function(g){var p=c.MODE_KANJI,r=g,a=x.stringToBytesFuncs.SJIS;if(!a)throw"sjis not supported.";(function(n,t){var h=a(n);if(h.length!=2||(h[0]<<8|h[1])!=t)throw"sjis not supported."})("\\u53CB",38726);var e=a(g),f={};return f.getMode=function(){return p},f.getLength=function(n){return~~(e.length/2)},f.write=function(n){for(var t=e,h=0;h+1<t.length;){var u=(255&t[h])<<8|255&t[h+1];if(33088<=u&&u<=40956)u-=33088;else if(57408<=u&&u<=60351)u-=49472;else throw"illegal char at "+(h+1)+"/"+u;u=(u>>>8&255)*192+(u&255),n.put(u,13),h+=2}if(h<t.length)throw"illegal char at "+(h+1)},f},_=function(){var g=[],p={};return p.writeByte=function(r){g.push(r&255)},p.writeShort=function(r){p.writeByte(r),p.writeByte(r>>>8)},p.writeBytes=function(r,a,e){a=a||0,e=e||r.length;for(var f=0;f<e;f+=1)p.writeByte(r[f+a])},p.writeString=function(r){for(var a=0;a<r.length;a+=1)p.writeByte(r.charCodeAt(a))},p.toByteArray=function(){return g},p.toString=function(){var r="";r+="[";for(var a=0;a<g.length;a+=1)a>0&&(r+=","),r+=g[a];return r+="]",r},p},$=function(){var g=0,p=0,r=0,a="",e={},f=function(t){a+=String.fromCharCode(n(t&63))},n=function(t){if(!(t<0)){if(t<26)return 65+t;if(t<52)return 97+(t-26);if(t<62)return 48+(t-52);if(t==62)return 43;if(t==63)return 47}throw"n:"+t};return e.writeByte=function(t){for(g=g<<8|t&255,p+=8,r+=1;p>=6;)f(g>>>p-6),p-=6},e.flush=function(){if(p>0&&(f(g<<6-p),g=0,p=0),r%3!=0)for(var t=3-r%3,h=0;h<t;h+=1)a+="="},e.toString=function(){return a},e},V=function(g){var p=g,r=0,a=0,e=0,f={};f.read=function(){for(;e<8;){if(r>=p.length){if(e==0)return-1;throw"unexpected end of file./"+e}var t=p.charAt(r);if(r+=1,t=="=")return e=0,-1;if(t.match(/^\\s$/))continue;a=a<<6|n(t.charCodeAt(0)),e+=6}var h=a>>>e-8&255;return e-=8,h};var n=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(t==43)return 62;if(t==47)return 63;throw"c:"+t};return f},j=function(g,p){var r=g,a=p,e=new Array(g*p),f={};f.setPixel=function(u,d,B){e[d*r+u]=B},f.write=function(u){u.writeString("GIF87a"),u.writeShort(r),u.writeShort(a),u.writeByte(128),u.writeByte(0),u.writeByte(0),u.writeByte(0),u.writeByte(0),u.writeByte(0),u.writeByte(255),u.writeByte(255),u.writeByte(255),u.writeString(","),u.writeShort(0),u.writeShort(0),u.writeShort(r),u.writeShort(a),u.writeByte(0);var d=2,B=t(d);u.writeByte(d);for(var E=0;B.length-E>255;)u.writeByte(255),u.writeBytes(B,E,255),E+=255;u.writeByte(B.length-E),u.writeBytes(B,E,B.length-E),u.writeByte(0),u.writeString(";")};var n=function(u){var d=u,B=0,E=0,k={};return k.write=function(R,N){if(R>>>N)throw"length over";for(;B+N>=8;)d.writeByte(255&(R<<B|E)),N-=8-B,R>>>=8-B,E=0,B=0;E=R<<B|E,B=B+N},k.flush=function(){B>0&&d.writeByte(E)},k},t=function(u){for(var d=1<<u,B=(1<<u)+1,E=u+1,k=h(),R=0;R<d;R+=1)k.add(String.fromCharCode(R));k.add(String.fromCharCode(d)),k.add(String.fromCharCode(B));var N=_(),K=n(N);K.write(d,E);var J=0,q=String.fromCharCode(e[J]);for(J+=1;J<e.length;){var X=String.fromCharCode(e[J]);J+=1,k.contains(q+X)?q=q+X:(K.write(k.indexOf(q),E),k.size()<4095&&(k.size()==1<<E&&(E+=1),k.add(q+X)),q=X)}return K.write(k.indexOf(q),E),K.write(B,E),K.flush(),N.toByteArray()},h=function(){var u={},d=0,B={};return B.add=function(E){if(B.contains(E))throw"dup key:"+E;u[E]=d,d+=1},B.size=function(){return d},B.indexOf=function(E){return u[E]},B.contains=function(E){return typeof u[E]!="undefined"},B};return f},F=function(g,p,r){for(var a=j(g,p),e=0;e<p;e+=1)for(var f=0;f<g;f+=1)a.setPixel(f,e,r(f,e));var n=_();a.write(n);for(var t=$(),h=n.toByteArray(),u=0;u<h.length;u+=1)t.writeByte(h[u]);return t.flush(),"data:image/gif;base64,"+t};return x})();(function(){ot.stringToBytesFuncs["UTF-8"]=function(x){function c(T){for(var A=[],L=0;L<T.length;L++){var M=T.charCodeAt(L);M<128?A.push(M):M<2048?A.push(192|M>>6,128|M&63):M<55296||M>=57344?A.push(224|M>>12,128|M>>6&63,128|M&63):(L++,M=65536+((M&1023)<<10|T.charCodeAt(L)&1023),A.push(240|M>>18,128|M>>12&63,128|M>>6&63,128|M&63))}return A}return c(x)}})();(function(x){typeof define=="function"&&define.amd?define([],x):typeof ft=="object"&&(ut.exports=x())})(function(){return ot})});var vt=yt(st(),1);function mt(x,c="H"){let T=(0,vt.default)(0,c);T.addData(x),T.make();let A=T.getModuleCount(),L=[];for(let M=0;M<A;M++){let U=[];for(let O=0;O<A;O++)U.push(T.isDark(M,O));L.push(U)}return L}var D=x=>Math.round(x*1e3)/1e3;function Bt(x,c,T){let A=x<=6,L=x>=T-7,M=c<=6,U=c>=T-7;return A&&M||A&&U||L&&M}function tt(x,c={}){let{pixelSize:T=512,style:A="dot",dark:L="#111111",light:M="#ffffff",ecc:U="H",ariaLabel:O="\\u8F66\\u8F86\\u632A\\u8F66\\u4E8C\\u7EF4\\u7801"}=c,P=mt(x,U),S=P.length,G=120,W=72,Y=(G-W)/2,_=W/S,$=[];$.push(\`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \${G} \${G}" width="\${T}" height="\${T}" role="img" aria-label="\${O}">\`),$.push(\`<circle cx="60" cy="60" r="60" fill="\${M}"/>\`);for(let j=0;j<S;j++)for(let F=0;F<S;F++){if(!P[j][F]||Bt(j,F,S))continue;let g=Y+F*_,p=Y+j*_;A==="square"?$.push(\`<rect x="\${D(g)}" y="\${D(p)}" width="\${D(_)}" height="\${D(_)}" fill="\${L}"/>\`):$.push(\`<circle cx="\${D(g+_/2)}" cy="\${D(p+_/2)}" r="\${D(_*.48)}" fill="\${L}"/>\`)}let V=[[0,0],[0,S-7],[S-7,0]];for(let[j,F]of V){let g=Y+F*_,p=Y+j*_;$.push(\`<rect x="\${D(g)}" y="\${D(p)}" width="\${D(_*7)}" height="\${D(_*7)}" rx="\${D(_*1.6)}" fill="\${L}"/>\`),$.push(\`<rect x="\${D(g+_)}" y="\${D(p+_)}" width="\${D(_*5)}" height="\${D(_*5)}" rx="\${D(_*1.1)}" fill="\${M}"/>\`),$.push(\`<rect x="\${D(g+_*2)}" y="\${D(p+_*2)}" width="\${D(_*3)}" height="\${D(_*3)}" rx="\${D(_*.9)}" fill="\${L}"/>\`)}return $.push("</svg>"),$.join("")}(function(){"use strict";var x={site:null,cars:[],pageUrl:""},c=function(r){return document.getElementById(r)},T=null;function A(r){var a=c("toast");a&&(a.textContent=r,a.classList.add("show"),clearTimeout(T),T=setTimeout(function(){a.classList.remove("show")},2800))}function L(r){return String(r==null?"":r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function M(r){return!r||r.length<7?r||"":r.slice(0,3)+"****"+r.slice(-4)}var U=!1;function O(r,a){var e=a||{},f={method:e.method||"GET",headers:{"Content-Type":"application/json","X-Requested-With":"fetch"},credentials:"same-origin",cache:"no-store"};return e.body!==void 0&&(f.body=JSON.stringify(e.body)),fetch(r,f).then(function(n){return n.json().catch(function(){return{}}).then(function(t){if(n.status===401&&r!=="/api/admin/login"&&!U)throw U=!0,location.replace("/admin"),new Error("\\u767B\\u5F55\\u5DF2\\u8FC7\\u671F\\uFF0C\\u8BF7\\u91CD\\u65B0\\u767B\\u5F55");if(!n.ok||!t.ok){var h=new Error(t&&t.message||"\\u8BF7\\u6C42\\u5931\\u8D25");throw h.code=t&&t.code,h}return t.data})})}function P(r,a){var e=c(r);e&&(a?(e.textContent=a,e.hidden=!1):e.hidden=!0)}var S=c("loginForm");S&&S.addEventListener("submit",function(r){r.preventDefault();var a=c("pwd").value,e=c("loginBtn");if(!a)return P("authError","\\u8BF7\\u8F93\\u5165\\u5BC6\\u7801");P("authError",""),e.disabled=!0,O("/api/admin/login",{method:"POST",body:{password:a}}).then(function(){location.reload()}).catch(function(f){P("authError",f.message),e.disabled=!1})});var G=c("initForm");if(G&&G.addEventListener("submit",function(r){r.preventDefault();var a=c("pwd1").value,e=c("pwd2").value,f=c("initBtn");if(a.length<8)return P("authError","\\u5BC6\\u7801\\u81F3\\u5C11 8 \\u4F4D");if(a!==e)return P("authError","\\u4E24\\u6B21\\u8F93\\u5165\\u7684\\u5BC6\\u7801\\u4E0D\\u4E00\\u81F4");P("authError",""),f.disabled=!0,O("/api/admin/init",{method:"POST",body:{password:a}}).then(function(){location.reload()}).catch(function(n){P("authError",n.message),f.disabled=!1})}),S||G)return;c("shell").hidden=!1,c("logoutBtn").addEventListener("click",function(){O("/api/admin/logout",{method:"POST"}).then(function(){location.reload()})});var W=document.querySelectorAll(".tab");Array.prototype.forEach.call(W,function(r){r.addEventListener("click",function(){var a=r.getAttribute("data-tab");Array.prototype.forEach.call(W,function(e){e.setAttribute("aria-selected",e===r?"true":"false")}),Array.prototype.forEach.call(document.querySelectorAll(".panel"),function(e){e.classList.toggle("active",e.id==="panel-"+a)})})});function Y(){var r=c("carList");if(!x.cars.length){r.innerHTML='<div class="empty">\\u8FD8\\u6CA1\\u6709\\u8F66\\u8F86<br>\\u70B9\\u51FB\\u53F3\\u4E0A\\u89D2\\u300C\\u6DFB\\u52A0\\u8F66\\u8F86\\u300D\\u5F00\\u59CB</div>';return}var a="";x.cars.forEach(function(e){var f=[e.color,e.model].filter(Boolean).join(" \\xB7 ")||"\\u672A\\u586B\\u5199\\u8F66\\u578B";a+='<div class="car-row" data-id="'+L(e.id)+'"><span class="dot'+(e.enabled?"":" off")+'"></span><div class="car-row-main"><div class="car-row-plate">'+L(e.plate)+'</div><div class="car-row-sub">'+L(f)+" \\xB7 "+L(M(e.phone))+(e.enabled?"":" \\xB7 \\u5DF2\\u505C\\u7528")+'</div></div><div class="car-row-ops"><button class="icon-btn" data-act="edit" type="button" aria-label="\\u7F16\\u8F91"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M14 6l4 4"/></svg></button><button class="icon-btn danger" data-act="del" type="button" aria-label="\\u5220\\u9664"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/></svg></button></div></div>'}),r.innerHTML=a}c("carList").addEventListener("click",function(r){var a=r.target.closest?r.target.closest("[data-act]"):null;if(a){var e=a.closest(".car-row");if(e){var f=e.getAttribute("data-id"),n=null;if(x.cars.forEach(function(t){t.id===f&&(n=t)}),!!n){if(a.getAttribute("data-act")==="edit"){_(n);return}confirm("\\u786E\\u5B9A\\u5220\\u9664 "+n.plate+" \\u5417\\uFF1F\\u5220\\u9664\\u540E\\u4E0D\\u53EF\\u6062\\u590D\\u3002")&&O("/api/admin/car?id="+encodeURIComponent(f)+"&rev="+x.site.rev,{method:"DELETE"}).then(p).then(function(){A("\\u5DF2\\u5220\\u9664")}).catch(function(t){A(t.message)})}}}});function _(r){c("carId").value=r?r.id:"",c("carPlate").value=r?r.plate:"",c("carModel").value=r&&r.model||"",c("carColor").value=r&&r.color||"",c("carPhone").value=r&&r.phone||"",c("carEnabled").checked=r?r.enabled!==!1:!0,c("carModalTitle").textContent=r?"\\u7F16\\u8F91\\u8F66\\u8F86":"\\u6DFB\\u52A0\\u8F66\\u8F86",P("carError",""),c("carModal").hidden=!1,c("carPlate").focus()}function $(){c("carModal").hidden=!0}c("addCarBtn").addEventListener("click",function(){_(null)}),c("carCancelBtn").addEventListener("click",$),c("carModal").addEventListener("click",function(r){r.target===c("carModal")&&$()}),c("carForm").addEventListener("submit",function(r){r.preventDefault();var a={id:c("carId").value||void 0,plate:c("carPlate").value,model:c("carModel").value,color:c("carColor").value,phone:c("carPhone").value,enabled:c("carEnabled").checked,rev:x.site.rev},e=c("carSaveBtn");e.disabled=!0,P("carError",""),O("/api/admin/car",{method:"POST",body:a}).then(function(){return $(),p()}).then(function(){A("\\u5DF2\\u4FDD\\u5B58\\uFF0C\\u5168\\u7403\\u8282\\u70B9\\u7EA6 5 \\u79D2~5 \\u5206\\u949F\\u540E\\u751F\\u6548")}).catch(function(f){P("carError",f.message)}).then(function(){e.disabled=!1})}),c("settingsForm").addEventListener("submit",function(r){r.preventDefault();var a=c("saveSettingsBtn");a.disabled=!0,O("/api/admin/page",{method:"PUT",body:{title:c("pageTitle").value,notice:c("pageNotice").value,rev:x.site.rev}}).then(p).then(function(){A("\\u5DF2\\u4FDD\\u5B58")}).catch(function(e){A(e.message)}).then(function(){a.disabled=!1})}),c("resetIdBtn").addEventListener("click",function(){confirm("\\u91CD\\u7F6E\\u540E\\u5F53\\u524D\\u4E8C\\u7EF4\\u7801\\u7ACB\\u5373\\u5931\\u6548\\uFF0C\\u9700\\u8981\\u91CD\\u65B0\\u4E0B\\u8F7D\\u5E76\\u6253\\u5370\\u3002\\u786E\\u5B9A\\u7EE7\\u7EED\\u5417\\uFF1F")&&O("/api/admin/page/reset-id",{method:"POST"}).then(p).then(function(){A("\\u5DF2\\u751F\\u6210\\u65B0\\u5730\\u5740\\uFF0C\\u65E7\\u4E8C\\u7EF4\\u7801\\u5DF2\\u5931\\u6548")}).catch(function(r){P("resetWarn",r.message)})}),c("passwordForm").addEventListener("submit",function(r){r.preventDefault();var a=c("newPwd").value,e=c("newPwd2").value;if(a.length<8)return P("pwdError","\\u65B0\\u5BC6\\u7801\\u81F3\\u5C11 8 \\u4F4D");if(a!==e)return P("pwdError","\\u4E24\\u6B21\\u8F93\\u5165\\u7684\\u65B0\\u5BC6\\u7801\\u4E0D\\u4E00\\u81F4");P("pwdError","");var f=c("changePwdBtn");f.disabled=!0,O("/api/admin/password",{method:"POST",body:{oldPassword:c("oldPwd").value,newPassword:a}}).then(function(){A("\\u5BC6\\u7801\\u5DF2\\u4FEE\\u6539\\uFF0C\\u8BF7\\u91CD\\u65B0\\u767B\\u5F55"),setTimeout(function(){location.reload()},1200)}).catch(function(n){P("pwdError",n.message),f.disabled=!1})});function V(r,a){r&&(r.innerHTML=tt(x.pageUrl,{pixelSize:a||512,style:"dot",ariaLabel:"\\u632A\\u8F66\\u4E8C\\u7EF4\\u7801"}))}function j(){c("qrLink").textContent=x.pageUrl,c("qrLink").href=x.pageUrl,V(c("qrCanvas"),600),V(c("qrPreview"),600),V(c("printQr"),800),c("printPlate").textContent=x.cars.length?x.cars[0].plate:""}c("copyLinkBtn").addEventListener("click",function(){if(!navigator.clipboard||!navigator.clipboard.writeText){A("\\u5F53\\u524D\\u6D4F\\u89C8\\u5668\\u4E0D\\u652F\\u6301\\u81EA\\u52A8\\u590D\\u5236\\uFF0C\\u8BF7\\u957F\\u6309\\u94FE\\u63A5\\u624B\\u52A8\\u590D\\u5236");return}navigator.clipboard.writeText(x.pageUrl).then(function(){A("\\u94FE\\u63A5\\u5DF2\\u590D\\u5236")}).catch(function(){A("\\u590D\\u5236\\u5931\\u8D25\\uFF0C\\u8BF7\\u624B\\u52A8\\u9009\\u62E9")})});function F(r,a){var e=URL.createObjectURL(a),f=document.createElement("a");f.href=e,f.download=r,f.click(),setTimeout(function(){URL.revokeObjectURL(e)},2e3)}c("downloadSvgBtn").addEventListener("click",function(){var r=tt(x.pageUrl,{pixelSize:1024});F("\\u632A\\u8F66\\u4E8C\\u7EF4\\u7801-"+x.site.id+".svg",new Blob([r],{type:"image/svg+xml;charset=utf-8"}))}),c("downloadPngBtn").addEventListener("click",function(){g(x.pageUrl,1024).then(function(r){F("\\u632A\\u8F66\\u4E8C\\u7EF4\\u7801-"+x.site.id+".png",r)}).catch(function(){A("\\u5BFC\\u51FA\\u5931\\u8D25\\uFF0C\\u8BF7\\u6539\\u7528 SVG")})}),c("printBtn").addEventListener("click",function(){V(c("printQr"),800),window.print()});function g(r,a){return new Promise(function(e,f){var n=tt(r,{pixelSize:a}),t=new Blob([n],{type:"image/svg+xml;charset=utf-8"}),h=URL.createObjectURL(t),u=new Image;u.onload=function(){var d=document.createElement("canvas");d.width=a,d.height=a;var B=d.getContext("2d");B.fillStyle="#ffffff",B.fillRect(0,0,a,a),B.drawImage(u,0,0,a,a),URL.revokeObjectURL(h),d.toBlob(function(E){E?e(E):f(new Error("\\u5BFC\\u51FA\\u5931\\u8D25"))},"image/png")},u.onerror=function(){URL.revokeObjectURL(h),f(new Error("\\u5BFC\\u51FA\\u5931\\u8D25"))},u.src=h})}function p(){return O("/api/admin/session").then(function(r){x.site=r.site,x.cars=r.site.cars||[],x.pageUrl=r.pageUrl,c("pageTitle").value=r.site.title||"",c("pageNotice").value=r.site.notice||"",Y(),j()})}p().catch(function(r){A(r.message||"\\u52A0\\u8F7D\\u5931\\u8D25")})})();})();
`;

// src/worker/handlers/publicPages.js
async function handleParkPage(env, request, pageId) {
  const site = await readSite(env);
  if (!site || site.id !== pageId) {
    return documentShell({
      title: "\u632A\u8F66\u7801\u65E0\u6548",
      css: CSS,
      script: "",
      bodyClass: "park-body",
      body: renderNotFoundBody(),
      cache: "no-store"
    });
  }
  const body = renderParkBody(site);
  return documentShell({
    title: site.title || "\u632A\u8F66\u7801",
    css: CSS,
    script: PARK_JS,
    bodyClass: "park-body",
    body,
    // 页面本身不含隐私数据，可短暂缓存；号码接口单独 no-store
    cache: "public, max-age=30"
  });
}
async function handleQrSvg(env, request, pageId) {
  const site = await readSite(env);
  if (!site || site.id !== pageId) return htmlPage("\u632A\u8F66\u7801\u65E0\u6548", { status: 404 });
  const url = `${new URL(request.url).origin}/p/${pageId}`;
  const svg = renderQrSvg(url, { pixelSize: 1024, style: "dot" });
  return svgImage(svg);
}
function handleRobots() {
  return text("User-agent: *\nDisallow: /\n", { cache: "public, max-age=86400" });
}

// src/worker/lib/ratelimit.js
async function rateLimit(env, bucket, identity, rule) {
  const now = Date.now();
  const slot = Math.floor(now / rule.windowMs);
  const key = `rl_${bucket}_${hashIdentity(identity)}_${slot}`;
  const rec = await readJson(env, key) || { n: 0, blockedUntil: 0 };
  if (rec.blockedUntil && rec.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((rec.blockedUntil - now) / 1e3) };
  }
  rec.n = (rec.n || 0) + 1;
  if (rec.n > rule.limit) {
    rec.blockedUntil = now + (rule.blockMs || rule.windowMs);
    await writeJson(env, key, rec);
    return { allowed: false, retryAfter: Math.ceil((rule.blockMs || rule.windowMs) / 1e3) };
  }
  await writeJson(env, key, rec);
  return { allowed: true, remaining: Math.max(0, rule.limit - rec.n) };
}
function hashIdentity(identity) {
  let h = 2166136261;
  const s = String(identity || "unknown");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || request.headers.get("X-Real-IP") || "unknown";
}
var RULES = {
  login: { limit: 5, windowMs: 10 * 60 * 1e3, blockMs: 10 * 60 * 1e3 },
  contact: { limit: 10, windowMs: 60 * 60 * 1e3, blockMs: 30 * 60 * 1e3 },
  write: { limit: 120, windowMs: 60 * 1e3, blockMs: 60 * 1e3 }
};

// src/worker/handlers/publicApi.js
async function readBody(request) {
  try {
    const text2 = await request.text();
    return text2 ? JSON.parse(text2) : {};
  } catch {
    return null;
  }
}
async function handleContact(env, request, pageId) {
  const rl = await rateLimit(env, "contact", clientIp(request), RULES.contact);
  if (!rl.allowed) return fail("RATE_LIMITED", `\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7 ${rl.retryAfter} \u79D2\u540E\u518D\u8BD5`, 429);
  const site = await readSite(env);
  if (!site || site.id !== pageId) return fail("NOT_FOUND", "\u632A\u8F66\u7801\u65E0\u6548", 404);
  const body = await readBody(request);
  if (!body || typeof body.carId !== "string") return fail("INVALID_INPUT", "\u53C2\u6570\u9519\u8BEF");
  const car = (site.cars || []).find((c) => c.id === body.carId);
  if (!car || car.enabled === false) return fail("NOT_FOUND", "\u8F66\u8F86\u4FE1\u606F\u4E0D\u5B58\u5728", 404);
  return ok({ phone: car.phone, plate: car.plate });
}

// src/worker/views/admin.js
function icon(paths) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}
var ICONS = {
  edit: icon('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M14 6l4 4"/>'),
  trash: icon('<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>'),
  plus: icon('<path d="M12 5v14M5 12h14"/>'),
  logout: icon('<path d="M15 4h4v16h-4"/><path d="M10 12h9"/><path d="M10 12l3-3M10 12l3 3"/>'),
  copy: icon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5H6a2 2 0 0 0-2 2v9"/>')
};
function renderLoginView({ initialized }) {
  if (!initialized) {
    return `<div class="auth">
  <form class="auth-card" id="initForm" novalidate>
    <div class="auth-logo">\u632A</div>
    <h1>\u521D\u59CB\u5316\u7BA1\u7406\u5458\u5BC6\u7801</h1>
    <p class="sub">\u8FD9\u662F\u9996\u6B21\u4F7F\u7528\uFF0C\u8BF7\u8BBE\u7F6E\u4E00\u4E2A\u53EA\u5C5E\u4E8E\u81EA\u5DF1\u7684\u540E\u53F0\u5BC6\u7801\u3002\u5BC6\u7801\u4E0D\u4F1A\u4EE5\u660E\u6587\u5B58\u50A8\uFF0C\u8BBE\u7F6E\u540E\u65E0\u6CD5\u67E5\u770B\uFF0C\u8BF7\u81EA\u884C\u59A5\u5584\u4FDD\u7BA1\u3002</p>
    <div class="alert" id="authError" hidden></div>
    <div class="field">
      <label for="pwd1">\u8BBE\u7F6E\u5BC6\u7801</label>
      <input class="input" id="pwd1" type="password" autocomplete="new-password" placeholder="\u81F3\u5C11 8 \u4F4D\uFF0C\u5EFA\u8BAE\u542B\u5B57\u6BCD\u548C\u6570\u5B57" required>
    </div>
    <div class="field">
      <label for="pwd2">\u518D\u6B21\u8F93\u5165</label>
      <input class="input" id="pwd2" type="password" autocomplete="new-password" placeholder="\u8BF7\u518D\u6B21\u8F93\u5165" required>
    </div>
    <button class="btn btn-block" type="submit" id="initBtn">\u5B8C\u6210\u521D\u59CB\u5316</button>
    <p class="muted" style="margin:16px 0 0;text-align:center">\u521D\u59CB\u5316\u5B8C\u6210\u540E\u5373\u53EF\u767B\u5F55\u540E\u53F0\u5F55\u5165\u8F66\u8F86</p>
  </form>
</div>`;
  }
  return `<div class="auth">
  <form class="auth-card" id="loginForm" novalidate>
    <div class="auth-logo">\u632A</div>
    <h1>\u540E\u53F0\u767B\u5F55</h1>
    <p class="sub">\u8BF7\u8F93\u5165\u7BA1\u7406\u5458\u5BC6\u7801\uFF0C\u767B\u5F55\u540E\u53EF\u7BA1\u7406\u8F66\u8F86\u4E0E\u4E8C\u7EF4\u7801\u3002</p>
    <div class="alert" id="authError" hidden></div>
    <div class="field">
      <label for="pwd">\u7BA1\u7406\u5458\u5BC6\u7801</label>
      <input class="input" id="pwd" type="password" autocomplete="current-password" placeholder="\u8BF7\u8F93\u5165\u5BC6\u7801" required>
    </div>
    <button class="btn btn-block" type="submit" id="loginBtn">\u767B\u5F55</button>
  </form>
</div>`;
}
function renderAdminBody() {
  return `<div class="shell" id="shell" hidden>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">\u632A</div>
      <div>
        <h1>\u632A\u8F66\u7801\u540E\u53F0</h1>
        <p>\u8F66\u8F86\u4E0E\u4E8C\u7EF4\u7801\u7BA1\u7406</p>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm" id="logoutBtn" type="button">${ICONS.logout}<span>\u9000\u51FA</span></button>
  </header>

  <nav class="tabs" role="tablist">
    <button class="tab" role="tab" data-tab="cars" aria-selected="true" type="button">\u8F66\u8F86\u7BA1\u7406</button>
    <button class="tab" role="tab" data-tab="qr" aria-selected="false" type="button">\u4E8C\u7EF4\u7801</button>
    <button class="tab" role="tab" data-tab="settings" aria-selected="false" type="button">\u9875\u9762\u8BBE\u7F6E</button>
    <button class="tab" role="tab" data-tab="account" aria-selected="false" type="button">\u8D26\u53F7\u5B89\u5168</button>
  </nav>

  <section class="panel active" id="panel-cars">
    <div class="card">
      <div class="card-head">
        <div>
          <h2>\u8F66\u8F86\u5217\u8868</h2>
          <p class="desc">\u626B\u7801\u9875\u6309\u6B64\u987A\u5E8F\u5C55\u793A\uFF0C\u5DF2\u505C\u7528\u7684\u8F66\u8F86\u4E0D\u4F1A\u51FA\u73B0\u5728\u9875\u9762\u4E0A</p>
        </div>
        <button class="btn btn-sm" id="addCarBtn" type="button">${ICONS.plus}<span>\u6DFB\u52A0\u8F66\u8F86</span></button>
      </div>
      <div id="carList"><div class="empty">\u52A0\u8F7D\u4E2D\u2026</div></div>
    </div>
  </section>

  <section class="panel" id="panel-qr">
    <div class="card">
      <div class="card-head">
        <div>
          <h2>\u632A\u8F66\u4E8C\u7EF4\u7801</h2>
          <p class="desc">\u5706\u5F62\u6837\u5F0F\uFF0C\u4E2D\u95F4\u4E3A\u4E8C\u7EF4\u7801\u77E9\u9635\u3002\u5EFA\u8BAE\u6253\u5370\u76F4\u5F84\u4E0D\u5C0F\u4E8E 3cm</p>
        </div>
      </div>
      <div class="qr-wrap">
        <div class="qr-canvas" id="qrCanvas"></div>
        <div class="qr-side">
          <div class="muted">\u626B\u7801\u6253\u5F00\u7684\u9875\u9762\u5730\u5740</div>
          <a class="qr-link" id="qrLink" href="#" target="_blank" rel="noopener"></a>
          <div class="btn-row">
            <button class="btn btn-sm" id="downloadSvgBtn" type="button">\u4E0B\u8F7D SVG</button>
            <button class="btn btn-sm" id="downloadPngBtn" type="button">\u4E0B\u8F7D PNG</button>
            <button class="btn btn-sm btn-ghost" id="copyLinkBtn" type="button">${ICONS.copy}<span>\u590D\u5236\u94FE\u63A5</span></button>
            <button class="btn btn-sm btn-ghost" id="printBtn" type="button">\u6253\u5370\u8F66\u8D34</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <div>
          <h2>\u626B\u7801\u9884\u89C8</h2>
          <p class="desc">\u5728\u624B\u673A\u4E0A\u626B\u7801\u5373\u53EF\u67E5\u770B\u771F\u5B9E\u6548\u679C\uFF0C\u65E0\u9700\u5148\u6253\u5370</p>
        </div>
      </div>
      <div class="qr-wrap">
        <div class="qr-canvas" id="qrPreview"></div>
        <div class="qr-side">
          <p class="muted" style="margin:0 0 8px">\u8D34\u8F66\u4E4B\u524D\u5EFA\u8BAE\u5148\u7528\u624B\u673A\u626B\u4E00\u6B21\uFF0C\u786E\u8BA4\u80FD\u6B63\u5E38\u6253\u5F00\u5E76\u62E8\u53F7\u3002</p>
          <p class="muted" style="margin:0">\u4E8C\u7EF4\u7801\u4E0E\u9875\u9762\u5730\u5740\u7ED1\u5B9A\uFF0C\u91CD\u7F6E\u9875\u9762\u5730\u5740\u540E\u65E7\u7801\u7ACB\u5373\u5931\u6548\u3002</p>
        </div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-settings">
    <div class="card">
      <div class="card-head">
        <div>
          <h2>\u9875\u9762\u6587\u6848</h2>
          <p class="desc">\u663E\u793A\u5728\u626B\u7801\u9875\u9876\u90E8\uFF0C\u5E2E\u52A9\u5BF9\u65B9\u5FEB\u901F\u5224\u65AD</p>
        </div>
      </div>
      <form id="settingsForm">
        <div class="field">
          <label for="pageTitle">\u6807\u9898</label>
          <input class="input" id="pageTitle" maxlength="60" placeholder="\u4E34\u65F6\u505C\u8F66\uFF0C\u9700\u632A\u8F66\u8BF7\u8054\u7CFB\u6211">
        </div>
        <div class="field">
          <label for="pageNotice">\u63D0\u793A\u8BED</label>
          <input class="input" id="pageNotice" maxlength="80" placeholder="\u626B\u7801\u540E\u53EF\u4E00\u952E\u547C\u53EB\uFF0C\u611F\u8C22\u914D\u5408">
        </div>
        <button class="btn" type="submit" id="saveSettingsBtn">\u4FDD\u5B58</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head">
        <div>
          <h2>\u91CD\u7F6E\u9875\u9762\u5730\u5740</h2>
          <p class="desc">\u91CD\u7F6E\u540E\u65E7\u4E8C\u7EF4\u7801\u7ACB\u5373\u5931\u6548\uFF0C\u9700\u91CD\u65B0\u4E0B\u8F7D\u6253\u5370</p>
        </div>
      </div>
      <div class="alert" id="resetWarn" hidden></div>
      <button class="btn btn-danger btn-sm" id="resetIdBtn" type="button">\u91CD\u7F6E\u5E76\u751F\u6210\u65B0\u4E8C\u7EF4\u7801</button>
    </div>
  </section>

  <section class="panel" id="panel-account">
    <div class="card">
      <div class="card-head">
        <div>
          <h2>\u4FEE\u6539\u5BC6\u7801</h2>
          <p class="desc">\u4FEE\u6539\u540E\u6240\u6709\u5DF2\u767B\u5F55\u7684\u8BBE\u5907\u9700\u8981\u91CD\u65B0\u767B\u5F55</p>
        </div>
      </div>
      <form id="passwordForm">
        <div class="field">
          <label for="oldPwd">\u5F53\u524D\u5BC6\u7801</label>
          <input class="input" id="oldPwd" type="password" autocomplete="current-password" required>
        </div>
        <div class="field">
          <label for="newPwd">\u65B0\u5BC6\u7801</label>
          <input class="input" id="newPwd" type="password" autocomplete="new-password" placeholder="\u81F3\u5C11 8 \u4F4D" required>
        </div>
        <div class="field">
          <label for="newPwd2">\u786E\u8BA4\u65B0\u5BC6\u7801</label>
          <input class="input" id="newPwd2" type="password" autocomplete="new-password" required>
        </div>
        <div class="alert" id="pwdError" hidden></div>
        <button class="btn" type="submit" id="changePwdBtn">\u4FDD\u5B58\u65B0\u5BC6\u7801</button>
      </form>
    </div>
  </section>
</div>

<div class="modal" id="carModal" hidden>
  <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="carModalTitle">
    <div class="modal-head">
      <h2 id="carModalTitle">\u6DFB\u52A0\u8F66\u8F86</h2>
    </div>
    <form id="carForm">
      <input type="hidden" id="carId">
      <div class="field">
        <label for="carPlate">\u8F66\u724C\u53F7</label>
        <input class="input" id="carPlate" maxlength="9" placeholder="\u5982 \u7CA4B12345" required>
      </div>
      <div class="row-2">
        <div class="field">
          <label for="carModel">\u8F66\u578B\uFF08\u9009\u586B\uFF09</label>
          <input class="input" id="carModel" maxlength="30" placeholder="\u5982 \u7279\u65AF\u62C9 Model 3">
        </div>
        <div class="field">
          <label for="carColor">\u989C\u8272\uFF08\u9009\u586B\uFF09</label>
          <input class="input" id="carColor" maxlength="12" placeholder="\u5982 \u767D\u8272">
        </div>
      </div>
      <div class="field">
        <label for="carPhone">\u8054\u7CFB\u7535\u8BDD</label>
        <input class="input" id="carPhone" maxlength="11" inputmode="numeric" placeholder="11 \u4F4D\u624B\u673A\u53F7" required>
      </div>
      <div class="switch-row">
        <div>
          <div style="font-size:14px;font-weight:600">\u5728\u626B\u7801\u9875\u663E\u793A</div>
          <div class="muted" style="margin-top:2px">\u5173\u95ED\u540E\u8BE5\u8F66\u4E0D\u4F1A\u51FA\u73B0\u5728\u626B\u7801\u9875\uFF0C\u4F46\u8BB0\u5F55\u4FDD\u7559</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="carEnabled" checked>
          <span></span>
        </label>
      </div>
      <div class="alert" id="carError" hidden></div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" id="carCancelBtn">\u53D6\u6D88</button>
        <button class="btn" type="submit" id="carSaveBtn">\u4FDD\u5B58</button>
      </div>
    </form>
  </div>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<div class="print-sheet" id="printSheet">
  <div class="p-qr" id="printQr"></div>
  <div class="p-plate" id="printPlate"></div>
  <div class="p-tip">\u5982\u9700\u632A\u8F66\uFF0C\u8BF7\u626B\u7801\u8054\u7CFB\u8F66\u4E3B<br>Scan to contact the owner</div>
  <div class="p-foot">\u672C\u7801\u7531\u8F66\u4E3B\u672C\u4EBA\u8D34\u7F6E</div>
</div>`;
}

// src/worker/lib/auth.js
var AUTH_KEY = "auth_admin";
var COOKIE_NAME = "mc_session";
var ITERATIONS = 12e4;
var SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
var enc = new TextEncoder();
function toB64Url(bytes) {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64Url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - str.length % 4);
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
async function pbkdf2(password, saltBytes, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    key,
    256
  );
  return new Uint8Array(bits);
}
async function hmac(secret2, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret2),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}
async function getAuthRecord(env) {
  return readJson(env, AUTH_KEY);
}
async function isInitialized(env) {
  return await getAuthRecord(env) !== null;
}
async function initPassword(env, password) {
  if (await isInitialized(env)) return false;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  await writeJson(env, AUTH_KEY, {
    alg: "PBKDF2-SHA256",
    iter: ITERATIONS,
    salt: toB64Url(salt),
    hash: toB64Url(hash),
    ver: 1,
    updatedAt: Date.now()
  });
  return true;
}
async function verifyPassword(env, password) {
  const rec = await getAuthRecord(env);
  if (!rec) return { ok: false, reason: "NOT_INITIALIZED" };
  const computed = await pbkdf2(password, fromB64Url(rec.salt), rec.iter);
  const expected = fromB64Url(rec.hash);
  return { ok: timingSafeEqual(computed, expected), ver: rec.ver };
}
async function changePassword(env, password) {
  const rec = await getAuthRecord(env);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  const nextVer = (rec?.ver || 1) + 1;
  await writeJson(env, AUTH_KEY, {
    alg: "PBKDF2-SHA256",
    iter: ITERATIONS,
    salt: toB64Url(salt),
    hash: toB64Url(hash),
    ver: nextVer,
    updatedAt: Date.now()
  });
  return nextVer;
}
function secret(env) {
  return env.ADMIN_SECRET || "dev-only-secret-change-me";
}
async function issueSession(env, ver) {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, ver, n: toB64Url(crypto.getRandomValues(new Uint8Array(8))) });
  const body = toB64Url(enc.encode(payload));
  const sig = toB64Url(await hmac(secret(env), body));
  return `${body}.${sig}`;
}
async function readSession(env, request) {
  const raw = getCookie(request, COOKIE_NAME);
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expected = toB64Url(await hmac(secret(env), body));
  if (!timingSafeEqual(fromB64Url(sig), fromB64Url(expected))) return null;
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64Url(body)));
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Date.now()) return null;
  const rec = await getAuthRecord(env);
  if (!rec || rec.ver !== payload.ver) return null;
  return payload;
}
function sessionCookie(env, value, { clear = false } = {}) {
  if (clear) {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  }
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1e3)}`;
}
function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

// src/worker/lib/validate.js
var PHONE_RE = /^1[3-9]\d{9}$/;
var PLATE_RE = /^[\u4e00-\u9fa5][A-Z][A-Z0-9·\s]{4,8}$/;
function normalizePhone(input) {
  return String(input || "").replace(/[\s-]/g, "");
}
function validatePhone(input) {
  const value = normalizePhone(input);
  if (!PHONE_RE.test(value)) return { ok: false, message: "\u8BF7\u8F93\u5165\u6B63\u786E\u7684 11 \u4F4D\u624B\u673A\u53F7" };
  return { ok: true, value };
}
function normalizePlate(input) {
  return String(input || "").replace(/\s+/g, "").toUpperCase();
}
function validatePlate(input) {
  const value = normalizePlate(input);
  if (value.length < 6 || value.length > 9) return { ok: false, message: "\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u8F66\u724C\u53F7" };
  if (!PLATE_RE.test(value)) return { ok: false, message: "\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u8F66\u724C\u53F7" };
  return { ok: true, value };
}
function cleanText(input, max = 40) {
  return String(input || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
}
function validateCarPayload(body) {
  const plate = validatePlate(body.plate);
  if (!plate.ok) return plate;
  const phone = validatePhone(body.phone);
  if (!phone.ok) return phone;
  return {
    ok: true,
    value: {
      plate: plate.value,
      phone: phone.value,
      model: cleanText(body.model, 30),
      color: cleanText(body.color, 12)
    }
  };
}
function validatePagePayload(body) {
  return {
    ok: true,
    value: {
      title: cleanText(body.title, 60) || "\u4E34\u65F6\u505C\u8F66\uFF0C\u9700\u632A\u8F66\u8BF7\u8054\u7CFB\u6211",
      notice: cleanText(body.notice, 80)
    }
  };
}
function newCarId() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// src/worker/handlers/adminApi.js
async function readBody2(request) {
  try {
    const text2 = await request.text();
    return text2 ? JSON.parse(text2) : {};
  } catch {
    return null;
  }
}
async function auth(env, request) {
  return readSession(env, request);
}
async function ensureSite(env) {
  const site = await readSite(env);
  if (site) return site;
  const created = emptySite(newPageId());
  created.rev = 1;
  await saveSite(env, created, void 0);
  return created;
}
function pageUrl(request, id) {
  return `${new URL(request.url).origin}/p/${id}`;
}
async function handleAdminPage(env, request) {
  const initialized = await isInitialized(env);
  if (!initialized) {
    return documentShell({
      title: "\u521D\u59CB\u5316\u7BA1\u7406\u5458",
      css: CSS,
      script: ADMIN_JS,
      bodyClass: "admin-body",
      body: renderLoginView({ initialized: false })
    });
  }
  const session = await readSession(env, request);
  if (!session) {
    return documentShell({
      title: "\u540E\u53F0\u767B\u5F55",
      css: CSS,
      script: ADMIN_JS,
      bodyClass: "admin-body",
      body: renderLoginView({ initialized: true })
    });
  }
  return documentShell({
    title: "\u632A\u8F66\u7801\u540E\u53F0",
    css: CSS,
    script: ADMIN_JS,
    bodyClass: "admin-body",
    body: renderAdminBody()
  });
}
async function handleLogin(env, request) {
  const rl = await rateLimit(env, "login", clientIp(request), RULES.login);
  if (!rl.allowed) return fail("RATE_LIMITED", `\u5C1D\u8BD5\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7 ${rl.retryAfter} \u79D2\u540E\u518D\u8BD5`, 429);
  const body = await readBody2(request);
  if (!body || typeof body.password !== "string") return fail("INVALID_INPUT", "\u53C2\u6570\u9519\u8BEF");
  const result = await verifyPassword(env, body.password);
  if (!result.ok) {
    const message = result.reason === "NOT_INITIALIZED" ? "\u5C1A\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u5148\u8BBE\u7F6E\u5BC6\u7801" : "\u5BC6\u7801\u9519\u8BEF";
    return fail("UNAUTHORIZED", message, 401);
  }
  const sid = await issueSession(env, result.ver);
  const res = ok({ loggedIn: true });
  res.headers.append("Set-Cookie", sessionCookie(env, sid));
  return res;
}
async function handleInit(env, request) {
  const rl = await rateLimit(env, "login", clientIp(request), RULES.login);
  if (!rl.allowed) return fail("RATE_LIMITED", `\u64CD\u4F5C\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7 ${rl.retryAfter} \u79D2\u540E\u518D\u8BD5`, 429);
  const body = await readBody2(request);
  if (!body || typeof body.password !== "string") return fail("INVALID_INPUT", "\u53C2\u6570\u9519\u8BEF");
  if (body.password.length < 8) return fail("INVALID_INPUT", "\u5BC6\u7801\u81F3\u5C11 8 \u4F4D");
  const created = await initPassword(env, body.password);
  if (!created) return fail("CONFLICT", "\u5DF2\u521D\u59CB\u5316\uFF0C\u65E0\u6CD5\u91CD\u590D\u8BBE\u7F6E", 409);
  await ensureSite(env);
  const result = await verifyPassword(env, body.password);
  const sid = await issueSession(env, result.ver);
  const res = ok({ initialized: true });
  res.headers.append("Set-Cookie", sessionCookie(env, sid));
  return res;
}
async function handleLogout(env) {
  const res = ok({ loggedOut: true });
  res.headers.append("Set-Cookie", sessionCookie(env, "", { clear: true }));
  return res;
}
async function handleSession(env, request) {
  if (!await auth(env, request)) return fail("UNAUTHORIZED", "\u672A\u767B\u5F55", 401);
  const site = await ensureSite(env);
  return ok({ site, pageUrl: pageUrl(request, site.id) });
}
async function handleSavePage(env, request) {
  if (!await auth(env, request)) return fail("UNAUTHORIZED", "\u672A\u767B\u5F55", 401);
  const body = await readBody2(request);
  if (!body) return fail("INVALID_INPUT", "\u53C2\u6570\u9519\u8BEF");
  const parsed = validatePagePayload(body);
  if (!parsed.ok) return fail("INVALID_INPUT", parsed.message);
  const site = await ensureSite(env);
  const written = await saveSite(
    env,
    { ...site, title: parsed.value.title, notice: parsed.value.notice },
    body.rev
  );
  if (!written.ok) return fail("REV_CONFLICT", "\u5185\u5BB9\u5DF2\u88AB\u5176\u4ED6\u7A97\u53E3\u4FEE\u6539\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5", 409);
  return ok({ site: written.site });
}
async function handleResetId(env, request) {
  if (!await auth(env, request)) return fail("UNAUTHORIZED", "\u672A\u767B\u5F55", 401);
  const site = await ensureSite(env);
  const nextId = newPageId();
  const written = await saveSite(env, { ...site, id: nextId }, void 0);
  if (!written.ok) return fail("REV_CONFLICT", "\u91CD\u7F6E\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5", 409);
  return ok({ site: written.site, pageUrl: pageUrl(request, nextId) });
}
async function handleSaveCar(env, request) {
  if (!await auth(env, request)) return fail("UNAUTHORIZED", "\u672A\u767B\u5F55", 401);
  const rl = await rateLimit(env, "write", clientIp(request), RULES.write);
  if (!rl.allowed) return fail("RATE_LIMITED", "\u64CD\u4F5C\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5", 429);
  const body = await readBody2(request);
  if (!body) return fail("INVALID_INPUT", "\u53C2\u6570\u9519\u8BEF");
  const parsed = validateCarPayload(body);
  if (!parsed.ok) return fail("INVALID_INPUT", parsed.message);
  const site = await ensureSite(env);
  const cars = Array.isArray(site.cars) ? site.cars.slice() : [];
  const id = body.id || newCarId();
  const index = cars.findIndex((c) => c.id === id);
  const car = {
    id,
    plate: parsed.value.plate,
    phone: parsed.value.phone,
    model: parsed.value.model,
    color: parsed.value.color,
    enabled: body.enabled !== false,
    sort: index >= 0 ? cars[index].sort : cars.length + 1
  };
  if (index >= 0) cars[index] = { ...cars[index], ...car };
  else cars.push(car);
  const written = await saveSite(env, { ...site, cars }, body.rev);
  if (!written.ok) return fail("REV_CONFLICT", "\u5185\u5BB9\u5DF2\u88AB\u5176\u4ED6\u7A97\u53E3\u4FEE\u6539\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5", 409);
  return ok({ site: written.site, carId: id });
}
async function handleDeleteCar(env, request, url) {
  if (!await auth(env, request)) return fail("UNAUTHORIZED", "\u672A\u767B\u5F55", 401);
  const id = url.searchParams.get("id");
  if (!id) return fail("INVALID_INPUT", "\u7F3A\u5C11\u8F66\u8F86 ID");
  const site = await ensureSite(env);
  const before = Array.isArray(site.cars) ? site.cars : [];
  const cars = before.filter((c) => c.id !== id);
  if (cars.length === before.length) return fail("NOT_FOUND", "\u8F66\u8F86\u4E0D\u5B58\u5728", 404);
  const written = await saveSite(env, { ...site, cars }, url.searchParams.get("rev"));
  if (!written.ok) return fail("REV_CONFLICT", "\u5185\u5BB9\u5DF2\u88AB\u5176\u4ED6\u7A97\u53E3\u4FEE\u6539\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5", 409);
  return ok({ site: written.site });
}
async function handleChangePassword(env, request) {
  if (!await auth(env, request)) return fail("UNAUTHORIZED", "\u672A\u767B\u5F55", 401);
  const body = await readBody2(request);
  if (!body) return fail("INVALID_INPUT", "\u53C2\u6570\u9519\u8BEF");
  const oldCheck = await verifyPassword(env, String(body.oldPassword || ""));
  if (!oldCheck.ok) return fail("UNAUTHORIZED", "\u5F53\u524D\u5BC6\u7801\u4E0D\u6B63\u786E", 401);
  const next = String(body.newPassword || "");
  if (next.length < 8) return fail("INVALID_INPUT", "\u65B0\u5BC6\u7801\u81F3\u5C11 8 \u4F4D");
  const ver = await changePassword(env, next);
  const sid = await issueSession(env, ver);
  const res = ok({ changed: true });
  res.headers.append("Set-Cookie", sessionCookie(env, sid));
  return res;
}

// src/worker/index.js
var PAGE_RE = /^[a-z0-9]{4,16}$/;
var index_default = {
  async fetch(request, context, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method.toUpperCase();
    try {
      if (method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { Allow: "GET, POST, PUT, DELETE, OPTIONS" } });
      }
      if (path === "/robots.txt") return handleRobots();
      const parkMatch = path.match(/^\/p\/([^/]+)$/);
      if (parkMatch) {
        if (method !== "GET") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
        return handleParkPage(env, request, parkMatch[1]);
      }
      const qrMatch = path.match(/^\/p\/([^/]+)\/qr\.svg$/);
      if (qrMatch) {
        if (method !== "GET") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
        return handleQrSvg(env, request, qrMatch[1]);
      }
      const contactMatch = path.match(/^\/api\/p\/([^/]+)\/contact$/);
      if (contactMatch) {
        if (method !== "POST") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
        if (!isSameOrigin(request)) return fail("FORBIDDEN", "\u975E\u6CD5\u6765\u6E90", 403);
        return handleContact(env, request, contactMatch[1]);
      }
      if (path === "/admin" || path === "/admin/") {
        if (method !== "GET") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
        return handleAdminPage(env, request);
      }
      if (path.startsWith("/api/admin/")) {
        if (method !== "GET" && method !== "POST" && method !== "PUT" && method !== "DELETE") {
          return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
        }
        if (method !== "GET" && !isSameOrigin(request)) return fail("FORBIDDEN", "\u975E\u6CD5\u6765\u6E90", 403);
        switch (path) {
          case "/api/admin/init":
            if (method !== "POST") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
            return handleInit(env, request);
          case "/api/admin/login":
            if (method !== "POST") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
            return handleLogin(env, request);
          case "/api/admin/logout":
            if (method !== "POST") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
            return handleLogout(env, request);
          case "/api/admin/session":
            if (method !== "GET") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
            return handleSession(env, request);
          case "/api/admin/page":
            if (method !== "PUT") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
            return handleSavePage(env, request);
          case "/api/admin/page/reset-id":
            if (method !== "POST") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
            return handleResetId(env, request);
          case "/api/admin/car":
            if (method === "POST") return handleSaveCar(env, request);
            if (method === "DELETE") return handleDeleteCar(env, request, url);
            return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
          case "/api/admin/password":
            if (method !== "POST") return fail("METHOD_NOT_ALLOWED", "\u65B9\u6CD5\u4E0D\u5141\u8BB8", 405);
            return handleChangePassword(env, request);
          default:
            return fail("NOT_FOUND", "\u63A5\u53E3\u4E0D\u5B58\u5728", 404);
        }
      }
      if (path === "/" || path === "/index.html") {
        const site = await readSite(env);
        if (site && PAGE_RE.test(site.id)) return redirect(`/p/${site.id}`);
        return redirect("/admin");
      }
      return fail("NOT_FOUND", "\u9875\u9762\u4E0D\u5B58\u5728", 404);
    } catch (err) {
      return fail("INTERNAL", "\u670D\u52A1\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", 500);
    }
  }
};
function isSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
export {
  index_default as default
};
