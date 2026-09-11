(() => {
  (function() {
    var DATA = JSON.parse(document.getElementById("planData").textContent);
    var SVGNS = "http://www.w3.org/2000/svg";
    var svg = document.getElementById("planSvg");
    svg.setAttribute("viewBox", "0 0 " + DATA.slideW.toFixed(2) + " " + DATA.slideH.toFixed(2));
    function el(tag, attrs) {
      var e = document.createElementNS(SVGNS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    }
    var defs = el("defs", {});
    var hatchPattern = el("pattern", { id: "palletHatch", width: 13, height: 13, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
    hatchPattern.appendChild(el("rect", { x: 0, y: 0, width: 13, height: 13, fill: "var(--pallet)" }));
    hatchPattern.appendChild(el("line", { x1: 0, y1: 0, x2: 0, y2: 13, stroke: "var(--pallet-line)", "stroke-width": 1.4, opacity: 0.4 }));
    defs.appendChild(hatchPattern);
    var shadow = el("filter", { id: "softShadow" });
    shadow.appendChild(el("feOffset", { dx: 0, dy: 0 }));
    defs.appendChild(shadow);
    svg.appendChild(defs);
    svg.appendChild(el("rect", { x: 0, y: 0, width: DATA.slideW, height: DATA.slideH, fill: "var(--panel)" }));
    var cssRoot = getComputedStyle(document.documentElement);
    function cssVar(name) {
      return cssRoot.getPropertyValue(name).trim();
    }
    var groups = { wall: [], shelf: [], fixture: [], pallet: [], room: [], pillar: [], door: [], tick: [] };
    DATA.pics.forEach(function(p) {
      groups[p.role].push(p);
    });
    function rectWithRot(p, attrs) {
      var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      var g = el("g", { transform: "rotate(" + p.rot + " " + cx + " " + cy + ")" });
      var r = el("rect", Object.assign({ x: p.x, y: p.y, width: p.w, height: p.h }, attrs));
      g.appendChild(r);
      return g;
    }
    function drawBox(p) {
      if (p.poly) {
        var poly = el("polygon", {
          points: p.poly.map(function(pt) {
            return pt[0] + "," + pt[1];
          }).join(" "),
          fill: "var(--panel-raised)",
          stroke: "var(--line)",
          "stroke-width": 2
        });
        p._rect = poly;
        p._group = poly;
        svg.appendChild(poly);
      } else {
        var g = rectWithRot(p, { fill: "var(--panel-raised)", stroke: "var(--line)", "stroke-width": 2, rx: 2 });
        p._rect = g.firstChild;
        p._group = g;
        svg.appendChild(g);
      }
    }
    groups.shelf.forEach(function(p, i) {
      if (!p.id) p.id = "shelf-" + i;
      drawBox(p);
    });
    groups.fixture.forEach(drawBox);
    groups.pallet.forEach(function(p, i) {
      if (!p.id) p.id = "pallet-" + i;
      var g = rectWithRot(p, { fill: "url(#palletHatch)", stroke: "var(--line)", "stroke-width": 2, rx: 2 });
      p._rect = g.firstChild;
      p._group = g;
      svg.appendChild(g);
    });
    var WALL_THICKNESS = 14;
    groups.room.forEach(function(p) {
      svg.appendChild(rectWithRot(p, { fill: "var(--panel-raised)", stroke: "var(--wall)", "stroke-width": WALL_THICKNESS }));
    });
    groups.pillar.forEach(function(p) {
      var g = rectWithRot(p, { fill: "var(--panel-raised)", stroke: "var(--wall)", "stroke-width": WALL_THICKNESS });
      var inset = 4;
      g.appendChild(el("line", { x1: p.x + inset, y1: p.y + inset, x2: p.x + p.w - inset, y2: p.y + p.h - inset, stroke: "var(--line)", "stroke-width": 2 }));
      g.appendChild(el("line", { x1: p.x + p.w - inset, y1: p.y + inset, x2: p.x + inset, y2: p.y + p.h - inset, stroke: "var(--line)", "stroke-width": 2 }));
      svg.appendChild(g);
    });
    var wallPoints = [
      [1696, 1586],
      [1435, 1586],
      [973, 1586],
      [973, 1744],
      [154, 1744],
      [154, 1267],
      [443, 905],
      [548, 905],
      [581, 787],
      [915, 787],
      [915, 550],
      [1019, 550],
      [1019, 295],
      [1267, 295],
      [1267, 34],
      [1696, 34],
      [1751.3333333333333, 34],
      [2995.3333333333335, 34],
      [2995.3333333333335, 1177],
      [3014.993, 1177],
      [3014.993, 1678.895],
      [2389.673, 1678.895],
      [2389.673, 1586],
      [2316.3333333333335, 1586],
      [2188.3333333333335, 1586],
      [1940.3333333333333, 1586]
    ];
    function straightenOrthogonal(points, closed, skipEdges) {
      for (var wk = 1; wk < points.length; wk++) {
        if (skipEdges && skipEdges.indexOf(wk) !== -1) continue;
        var prevPt = points[wk - 1], curPt = points[wk];
        if (Math.abs(curPt[0] - prevPt[0]) > Math.abs(curPt[1] - prevPt[1])) curPt[1] = prevPt[1];
        else curPt[0] = prevPt[0];
      }
      if (closed) {
        var firstPt = points[0], lastPt = points[points.length - 1];
        if (Math.abs(firstPt[0] - lastPt[0]) > Math.abs(firstPt[1] - lastPt[1])) lastPt[1] = firstPt[1];
        else lastPt[0] = firstPt[0];
      }
    }
    svg.appendChild(el("polygon", {
      points: wallPoints.map(function(pt) {
        return pt[0] + "," + pt[1];
      }).join(" "),
      fill: "none",
      stroke: "var(--wall)",
      "stroke-width": WALL_THICKNESS,
      "stroke-linejoin": "miter"
    }));
    var chilpanWallPoints = [[2493.353, 1319.255], [2712.863, 1324.925], [2716.103, 1217.195], [3088.3333333333335, 1173]];
    straightenOrthogonal(chilpanWallPoints, false);
    var joinPt = [3014.993, 1177];
    chilpanWallPoints[2][1] = joinPt[1];
    chilpanWallPoints[3] = joinPt.slice();
    svg.appendChild(el("polyline", {
      points: chilpanWallPoints.map(function(pt) {
        return pt[0] + "," + pt[1];
      }).join(" "),
      fill: "none",
      stroke: "var(--wall)",
      "stroke-width": WALL_THICKNESS,
      "stroke-linejoin": "miter",
      "stroke-linecap": "square"
    }));
    var extraRoomPoints = [[1960.3333333333335, 1588], [2160.3333333333335, 1588], [2160.3333333333335, 1768], [1960.3333333333335, 1768]];
    svg.appendChild(el("polygon", {
      points: extraRoomPoints.map(function(pt) {
        return pt[0] + "," + pt[1];
      }).join(" "),
      fill: "var(--panel-raised)",
      stroke: "var(--wall)",
      "stroke-width": WALL_THICKNESS,
      "stroke-linejoin": "miter"
    }));
    groups.tick.forEach(function(p) {
      svg.appendChild(rectWithRot(p, { fill: "var(--line)", stroke: "none" }));
    });
    groups.door.forEach(function(p) {
      var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      var flipParts = [];
      if (p.flip) flipParts.push("translate(" + 2 * cx + " 0) scale(-1 1)");
      if (p.vflip) flipParts.push("translate(0 " + 2 * cy + ") scale(1 -1)");
      var outer = el("g", flipParts.length ? { transform: flipParts.join(" ") } : {});
      var g = el("g", { transform: "rotate(" + p.rot + " " + cx + " " + cy + ")" });
      var r = Math.min(p.w, p.h);
      var hingeX = p.x, hingeY = p.y + p.h;
      var topX = p.x, topY = p.y;
      var farX = p.x + p.w, farY = p.y + p.h;
      var d = "M " + topX + " " + topY + " A " + r + " " + r + " 0 0 1 " + farX + " " + farY + " L " + hingeX + " " + hingeY + " Z";
      g.appendChild(el("path", { d, fill: "none", stroke: "var(--line)", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      outer.appendChild(g);
      svg.appendChild(outer);
    });
    var measureCanvas = document.createElement("canvas");
    var mctx = measureCanvas.getContext("2d");
    function measure(text, fontPx) {
      mctx.font = fontPx + 'px "Noto Sans KR","Malgun Gothic",system-ui,sans-serif';
      return mctx.measureText(text).width;
    }
    function wrapLines(text, fontPx, maxWidth) {
      if (!text) return [];
      if (measure(text, fontPx) <= maxWidth) return [text];
      var lines = [];
      var cur = "";
      for (var i = 0; i < text.length; i++) {
        var next = cur + text[i];
        if (measure(next, fontPx) > maxWidth && cur.length > 0) {
          lines.push(cur);
          cur = text[i];
        } else {
          cur = next;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    }
    function rotatedBBox(p) {
      var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      var rad = p.rot * Math.PI / 180, cosA = Math.cos(rad), sinA = Math.sin(rad);
      var corners = [[p.x, p.y], [p.x + p.w, p.y], [p.x, p.y + p.h], [p.x + p.w, p.y + p.h]];
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      corners.forEach(function(c) {
        var dx = c[0] - cx, dy = c[1] - cy;
        var rx = cx + dx * cosA - dy * sinA, ry = cy + dx * sinA + dy * cosA;
        minX = Math.min(minX, rx);
        maxX = Math.max(maxX, rx);
        minY = Math.min(minY, ry);
        maxY = Math.max(maxY, ry);
      });
      return { minX, maxX, minY, maxY };
    }
    var containerBoxes = groups.shelf.concat(groups.fixture).concat(groups.pallet).concat(groups.room);
    function findRoomRect(tb) {
      var tcx = tb.x + tb.w / 2, tcy = tb.y + tb.h / 2;
      var above = null, below = null, left = null, right = null;
      groups.wall.forEach(function(p) {
        var bb = rotatedBBox(p);
        var horizontal = bb.maxX - bb.minX >= bb.maxY - bb.minY;
        if (horizontal) {
          if (bb.minX - 60 <= tcx && bb.maxX + 60 >= tcx) {
            if (bb.maxY <= tcy + 5 && (!above || bb.maxY > above.maxY)) above = bb;
            if (bb.minY >= tcy - 5 && (!below || bb.minY < below.minY)) below = bb;
          }
        } else {
          if (bb.minY - 60 <= tcy && bb.maxY + 60 >= tcy) {
            if (bb.maxX <= tcx + 5 && (!left || bb.maxX > left.maxX)) left = bb;
            if (bb.minX >= tcx - 5 && (!right || bb.minX < right.minX)) right = bb;
          }
        }
      });
      if (above && below && left && right) {
        return { x: left.maxX, y: above.maxY, w: right.minX - left.maxX, h: below.minY - above.maxY, rot: 0 };
      }
      return null;
    }
    function near90(deg) {
      var r = (deg % 90 + 90) % 90;
      return r < 3 || r > 87;
    }
    var RENAME = {
      "\uC54C\uB9F9\uC774": "\uBBF8\uD488",
      "\uC784\uAC00\uACF5": "\uBD80\uC790\uC7AC",
      "\uB2E8\uC0C1\uC790": "\uBD80\uC790\uC7AC",
      "\uC218\uCD95\uD3EC": "\uBD80\uC790\uC7AC"
    };
    var uncertainLabels = [], unmatchedLabels = [];
    var textMatches = [];
    DATA.texts.forEach(function(tb) {
      var para = tb.paragraphs.filter(function(p) {
        return p.text && p.text.length > 0;
      })[0];
      if (!para) return;
      var tcx = tb.x + tb.w / 2, tcy = tb.y + tb.h / 2;
      var best = null, bestArea = Infinity, bestBBox = null, method = null;
      if (para.text === "\uC791\uC5C5\uB300") {
        var pinned = groups.fixture.filter(function(p) {
          return p.media === "image50.png";
        })[0];
        if (pinned) {
          best = pinned;
          bestBBox = rotatedBBox(pinned);
          method = "pinned";
        }
      }
      if (!best) containerBoxes.forEach(function(p) {
        var bb = rotatedBBox(p);
        if (tcx >= bb.minX && tcx <= bb.maxX && tcy >= bb.minY && tcy <= bb.maxY) {
          var area = (bb.maxX - bb.minX) * (bb.maxY - bb.minY);
          if (area < bestArea) {
            bestArea = area;
            best = p;
            bestBBox = bb;
            method = "contain";
          }
        }
      });
      var bestDist = null;
      if (!best) {
        bestDist = Infinity;
        containerBoxes.forEach(function(p) {
          var bb = rotatedBBox(p);
          var bcx = (bb.minX + bb.maxX) / 2, bcy = (bb.minY + bb.maxY) / 2;
          var d = Math.hypot(bcx - tcx, bcy - tcy);
          var maxSpan = Math.max(bb.maxX - bb.minX, bb.maxY - bb.minY);
          if (d < maxSpan * 2.5 + 200 && d < bestDist) {
            bestDist = d;
            best = p;
            bestBBox = bb;
            method = "fallback";
          }
        });
      }
      if (best) {
        best.rawLabel = best.rawLabel || (RENAME[para.text] || para.text);
        if (method === "fallback") {
          console.warn('[\uC9C0\uD558 \uAD6C\uD68D\uB3C4] "' + para.text + '" \uB77C\uBCA8\uC774 \uC5B4\uB5A4 \uB3C4\uD615 \uC548\uC5D0\uB3C4 \uC788\uC9C0 \uC54A\uC544 \uCD5C\uADFC\uC811 \uB9E4\uCE6D(' + Math.round(bestDist) + "px \uAC70\uB9AC, " + (best.media || best.role) + ")\uC73C\uB85C \uBD99\uC5C8\uC2B5\uB2C8\uB2E4. \uC704\uCE58\uB97C \uD655\uC778\uD558\uC138\uC694.");
          best._uncertainMatch = true;
          uncertainLabels.push(para.text);
          if (best._rect) {
            best._rect.setAttribute("stroke", "#c0392b");
            best._rect.setAttribute("stroke-dasharray", "7 5");
          }
        }
      } else {
        console.warn('[\uC9C0\uD558 \uAD6C\uD68D\uB3C4] "' + para.text + '" \uB77C\uBCA8\uC744 \uB9E4\uCE6D\uD560 \uB3C4\uD615\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4 -- \uD654\uBA74\uC5D0 \uD45C\uC2DC\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.');
        unmatchedLabels.push(para.text);
      }
      textMatches.push({ tb, para, best, bestBBox });
    });
    var matchWarnBanner = document.getElementById("matchWarnBanner");
    if (matchWarnBanner && (uncertainLabels.length || unmatchedLabels.length)) {
      var warnParts = [];
      if (uncertainLabels.length) warnParts.push("\uC704\uCE58\uAC00 \uBD88\uD655\uC2E4\uD558\uAC8C \uB9E4\uCE6D\uB41C \uB77C\uBCA8(\uB3C4\uBA74 \uC704 \uBE68\uAC04 \uC810\uC120 \uD14C\uB450\uB9AC \uD655\uC778): " + uncertainLabels.join(", "));
      if (unmatchedLabels.length) warnParts.push("\uB3C4\uD615\uC744 \uCC3E\uC9C0 \uBABB\uD574 \uD654\uBA74\uC5D0 \uD45C\uC2DC\uB418\uC9C0 \uC54A\uC740 \uB77C\uBCA8: " + unmatchedLabels.join(", "));
      matchWarnBanner.textContent = "\u26A0 \uB3C4\uBA74 \uB370\uC774\uD130\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694 \u2014 " + warnParts.join(" \xB7 ");
      matchWarnBanner.hidden = false;
    }
    var NO_SUFFIX = ["\uBB38", "\uC0AC\uBB34", "\uACAC\uBCF8", "\uCE60\uD310", "\uC5D8\uB9AC\uBCA0\uC774\uD130", "\uC791\uC5C5\uB300"];
    function shelfName(rawLabel) {
      var base = rawLabel || "\uC120\uBC18";
      if (NO_SUFFIX.indexOf(base) !== -1) return base;
      if (base.indexOf("\uC120\uBC18") !== -1) return base;
      return base + " \uC120\uBC18";
    }
    var byName = {};
    groups.shelf.concat(groups.fixture).forEach(function(p) {
      var name = shelfName(p.rawLabel);
      (byName[name] = byName[name] || []).push(p);
    });
    Object.keys(byName).forEach(function(name) {
      var list = byName[name];
      if (list.length === 1) {
        list[0].label = name;
        return;
      }
      list.sort(function(a, b) {
        var ay = a.y + a.h / 2, by = b.y + b.h / 2;
        return Math.abs(ay - by) > 20 ? ay - by : a.x + a.w / 2 - (b.x + b.w / 2);
      }).forEach(function(p, i) {
        p.label = name + " " + (i + 1);
      });
    });
    groups.fixture.forEach(function(p) {
      if (p.rawLabel === "\uC5D8\uB9AC\uBCA0\uC774\uD130") {
        p._rect.setAttribute("stroke", "var(--wall)");
        p._rect.setAttribute("stroke-width", WALL_THICKNESS);
      }
    });
    groups.pallet.concat(groups.room).forEach(function(p) {
      if (p.rawLabel) p.label = p.rawLabel;
    });
    groups.pallet.slice().sort(function(a, b) {
      var ay = a.y + a.h / 2, by = b.y + b.h / 2;
      return Math.abs(ay - by) > 20 ? ay - by : a.x + a.w / 2 - (b.x + b.w / 2);
    }).forEach(function(p, i) {
      if (!p.label) p.label = "\uD314\uB808\uD2B8 " + (i + 1);
    });
    var CLUSTER_GAP = 15;
    function bboxGap(a, b) {
      var gx = Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX);
      var gy = Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY);
      return Math.max(gx, gy);
    }
    function byReadingOrder(a, b) {
      var ay = a.y + a.h / 2, by = b.y + b.h / 2;
      return Math.abs(ay - by) > 20 ? ay - by : a.x + a.w / 2 - (b.x + b.w / 2);
    }
    var clusterable = groups.pallet.filter(function(p) {
      return !p.rawLabel;
    });
    clusterable.forEach(function(p) {
      p._bbox = rotatedBBox(p);
    });
    var parent = clusterable.map(function(_, i) {
      return i;
    });
    function find(i) {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
      }
      return i;
    }
    for (var ci = 0; ci < clusterable.length; ci++) {
      for (var cj = ci + 1; cj < clusterable.length; cj++) {
        if (bboxGap(clusterable[ci]._bbox, clusterable[cj]._bbox) <= CLUSTER_GAP) {
          var ri = find(ci), rj = find(cj);
          if (ri !== rj) parent[ri] = rj;
        }
      }
    }
    var clusters = {};
    clusterable.forEach(function(p, i) {
      (clusters[find(i)] = clusters[find(i)] || []).push(p);
    });
    Object.keys(clusters).forEach(function(k) {
      clusters[k].sort(byReadingOrder);
    });
    var palletUnits = groups.pallet.filter(function(p) {
      return p.rawLabel;
    }).map(function(p) {
      return { id: p.id, label: p.label, members: [p], isGroup: false };
    });
    Object.keys(clusters).map(function(k) {
      return clusters[k];
    }).filter(function(members) {
      return members.length > 1;
    }).sort(function(a, b) {
      return byReadingOrder(a[0], b[0]);
    }).forEach(function(members, i) {
      palletUnits.push({ id: "pgroup-" + members[0].id, label: "\uD314\uB808\uD2B8 \uBAA8\uC74C " + (i + 1), members, isGroup: true });
    });
    Object.keys(clusters).map(function(k) {
      return clusters[k];
    }).filter(function(members) {
      return members.length === 1;
    }).map(function(members) {
      return members[0];
    }).sort(byReadingOrder).forEach(function(p, i) {
      p.label = "\uD314\uB808\uD2B8 " + (i + 1);
      palletUnits.push({ id: p.id, label: p.label, members: [p], isGroup: false });
    });
    palletUnits.forEach(function(unit) {
      unit.members.forEach(function(p) {
        p._unit = unit;
      });
    });
    var CATEGORY_FILL = [
      { prefix: "\uC81C\uD488", fill: "var(--cat-product)" },
      { prefix: "\uAE30\uACC4\uD300", fill: "var(--cat-machine)" },
      { prefix: "\uBD80\uC790\uC7AC", fill: "var(--cat-pack)" },
      { prefix: "\uC0D8\uD50C", fill: "var(--cat-sample)" }
    ];
    groups.shelf.forEach(function(p) {
      if (!p.label) return;
      var match = CATEGORY_FILL.filter(function(c) {
        return p.label.indexOf(c.prefix) === 0;
      })[0];
      if (match) p._rect.setAttribute("fill", match.fill);
    });
    textMatches.forEach(function(m) {
      var tb = m.tb, para = m.para, best = m.best, bestBBox = m.bestBBox;
      var box = best || findRoomRect(tb) || tb;
      var bbox = bestBBox || rotatedBBox(box);
      var displayText = best && best.label ? best.label : para.text;
      var axisAligned = near90(box.rot);
      var groupRotation = axisAligned ? 0 : box.rot;
      var wrapWidth = axisAligned ? bbox.maxX - bbox.minX : box.w;
      var isVerticalLabel = axisAligned && bbox.maxY - bbox.minY > (bbox.maxX - bbox.minX) * 1.4;
      var fontPx = para.szPt * 1.333 * 0.72;
      var minFontPx = para.szPt * 1.333 * 0.4;
      var lines, lineHeights;
      if (isVerticalLabel) {
        groupRotation = 0;
        var chars = displayText.split("");
        var availableH = axisAligned ? bbox.maxY - bbox.minY : box.h;
        var totalH = function(fp) {
          return chars.reduce(function(sum, c) {
            return sum + (c === " " ? fp * 0.55 : fp * 1.12);
          }, 0);
        };
        while (totalH(fontPx) > availableH * 0.94 && fontPx > minFontPx) {
          fontPx *= 0.9;
        }
        lines = chars;
        lineHeights = chars.map(function(c) {
          return c === " " ? fontPx * 0.55 : fontPx * 1.12;
        });
      } else {
        var maxLines = 2;
        lines = wrapLines(displayText, fontPx, wrapWidth);
        while (lines.length > maxLines && fontPx > minFontPx) {
          fontPx *= 0.9;
          lines = wrapLines(displayText, fontPx, wrapWidth);
        }
        lineHeights = lines.map(function() {
          return fontPx * 1.12;
        });
      }
      var cx = box.x + box.w / 2 + (box.labelDx || 0), cy = box.y + box.h / 2 + (box.labelDy || 0);
      var g = el("g", { transform: groupRotation ? "rotate(" + groupRotation + " " + cx + " " + cy + ")" : "" });
      var totalBlockH = lineHeights.reduce(function(a, b) {
        return a + b;
      }, 0);
      var blockTop = cy - totalBlockH / 2;
      var yCursor = blockTop;
      lines.forEach(function(line, i) {
        var h2 = lineHeights[i];
        if (line !== " ") {
          var t = el("text", {
            x: cx,
            y: yCursor + h2 * 0.83,
            "font-size": fontPx.toFixed(1),
            "font-weight": 600,
            "text-anchor": "middle"
          });
          t.textContent = line;
          g.appendChild(t);
        }
        yCursor += h2;
      });
      svg.appendChild(g);
    });
    var GRID_ROWS = 2, DEFAULT_COLS = 4, MAX_COLS = 20;
    var backdrop = document.getElementById("modalBackdrop");
    var modalTitle = document.getElementById("modalTitle");
    var itemRowsEl = document.getElementById("itemRows");
    var addRowBtn = document.getElementById("addRow");
    var saveBtn = document.getElementById("saveBtn");
    var clearBtn = document.getElementById("clearBtn");
    var saveState = document.getElementById("saveState");
    var modalClose = document.getElementById("modalClose");
    var db = null, auth = null;
    var myTier = 0, myEmail = null;
    function canEdit() {
      return myTier >= 1;
    }
    function canResize() {
      return myTier >= 2;
    }
    var active = null;
    var stock = { shelves: {}, pallets: {} };
    var shelfIndex = {};
    groups.shelf.forEach(function(p) {
      shelfIndex[p.id] = p;
    });
    function filled(it) {
      return !!(it && (it.name || it.qty || it.threshold || it.expiry || it.lot));
    }
    function cellItems(cell) {
      if (!cell) return [];
      return (Array.isArray(cell) ? cell : [cell]).filter(filled);
    }
    function packCell(cell) {
      return Array.isArray(cell) ? { list: cell } : cell;
    }
    function unpackCell(cell) {
      return cell && cell.list ? cell.list : cell;
    }
    function cellCount(cells) {
      return cells.reduce(function(sum, c) {
        return sum + cellItems(c).length;
      }, 0);
    }
    function usedCells(cells) {
      return cells.filter(function(c) {
        return cellItems(c).length > 0;
      }).length;
    }
    function gridOf(p, data) {
      var cols, cells;
      if (data && data.cells && data.cells.length) {
        cols = data.cols || Math.ceil(data.cells.length / GRID_ROWS);
        cells = data.cells.slice(0, GRID_ROWS * cols);
      } else {
        cols = p.cols || DEFAULT_COLS;
        var items = (data && data.items || []).filter(filled);
        if (items.length > GRID_ROWS * cols) cols = Math.ceil(items.length / GRID_ROWS);
        cells = items.slice(0, GRID_ROWS * cols);
      }
      while (cells.length < GRID_ROWS * cols) cells.push(null);
      return { cols, cells };
    }
    function palletItems(unit) {
      var data = stock.pallets[unit.id];
      if (data && data.items && data.items.length) return data.items.filter(filled);
      return unit.members.reduce(function(acc, p) {
        acc = acc.concat(((stock.pallets[p.id] || {}).items || []).filter(filled));
        var oldGroupId = "pgroup-" + p.id;
        if (oldGroupId !== unit.id) {
          acc = acc.concat(((stock.pallets[oldGroupId] || {}).items || []).filter(filled));
        }
        return acc;
      }, []);
    }
    function countOf(p, collection) {
      return collection === "shelves" ? cellCount(gridOf(p, stock.shelves[p.id]).cells) : palletItems(p).length;
    }
    function expiryClass(expiry) {
      if (!expiry) return "";
      var t = Date.parse(expiry + "T00:00:00");
      if (isNaN(t)) return "";
      var days = Math.floor((t - Date.now()) / 864e5);
      return days < 0 ? "exp-over" : days <= 30 ? "exp-warn" : "";
    }
    function lowStockKey(it) {
      return (it.name || "").trim().toLowerCase() + " " + (it.lot || "").trim().toLowerCase();
    }
    var lowStockGroups = {};
    function buildLowStockGroups() {
      var map = {};
      function add(it) {
        if (!filled(it) || !it.name) return;
        var key = lowStockKey(it);
        var g = map[key] || (map[key] = { qty: 0, threshold: null });
        var q = parseInt(it.qty, 10);
        if (!isNaN(q)) g.qty += q;
        var t = parseInt(it.threshold, 10);
        if (g.threshold === null && !isNaN(t)) g.threshold = t;
      }
      groups.shelf.forEach(function(p) {
        gridOf(p, stock.shelves[p.id]).cells.forEach(function(c) {
          cellItems(c).forEach(add);
        });
      });
      palletUnits.forEach(function(p) {
        palletItems(p).forEach(add);
      });
      lowStockGroups = map;
    }
    function isLowStock(it) {
      if (!it || !it.name) return false;
      var g = lowStockGroups[lowStockKey(it)];
      return !!g && g.threshold !== null && g.qty <= g.threshold;
    }
    function makeRow(name, qty, threshold, expiry, lot) {
      var row = document.createElement("div");
      row.className = "item-row";
      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "\uC81C\uD488\uBA85";
      nameInput.value = name || "";
      var qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = "0";
      qtyInput.step = "1";
      qtyInput.className = "qty-input";
      qtyInput.placeholder = "\uC218\uB7C9";
      qtyInput.value = qty || "";
      var thresholdInput = document.createElement("input");
      thresholdInput.type = "number";
      thresholdInput.min = "0";
      thresholdInput.step = "1";
      thresholdInput.className = "qty-input";
      thresholdInput.placeholder = "\uAE30\uC900\uC218\uB7C9";
      thresholdInput.title = "\uAC19\uC740 \uC81C\uD488\uBA85+\uB85C\uD2B8\uBC88\uD638\uB294 \uBAA8\uB4E0 \uC704\uCE58 \uC218\uB7C9\uC744 \uD569\uCCD0\uC11C \uC774 \uAE30\uC900\uACFC \uBE44\uAD50\uD574\uC694. \uC800\uC7A5\uD558\uBA74 \uAC19\uC740 \uC81C\uD488/\uB85C\uD2B8\uB97C \uAC00\uC9C4 \uB2E4\uB978 \uC704\uCE58\uC758 \uAE30\uC900\uC218\uB7C9\uB3C4 \uC774 \uAC12\uC73C\uB85C \uC790\uB3D9\uC73C\uB85C \uB9DE\uCDB0\uC838\uC694.";
      thresholdInput.value = threshold || "";
      var expiryInput = document.createElement("input");
      expiryInput.type = "date";
      expiryInput.title = "\uC720\uD1B5\uAE30\uD55C";
      expiryInput.value = expiry || "";
      var lotInput = document.createElement("input");
      lotInput.type = "text";
      lotInput.placeholder = "\uB85C\uD2B8\uBC88\uD638";
      lotInput.value = lot || "";
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "\u2212";
      delBtn.addEventListener("click", function() {
        row.remove();
      });
      row.appendChild(nameInput);
      row.appendChild(qtyInput);
      row.appendChild(thresholdInput);
      row.appendChild(expiryInput);
      row.appendChild(lotInput);
      row.appendChild(delBtn);
      return row;
    }
    addRowBtn.addEventListener("click", function() {
      itemRowsEl.appendChild(makeRow("", "", "", "", ""));
    });
    function applyEditability() {
      var editable = canEdit();
      addRowBtn.hidden = !editable;
      saveBtn.hidden = !editable;
      if (!editable) clearBtn.hidden = true;
      Array.prototype.forEach.call(itemRowsEl.querySelectorAll("input"), function(inp) {
        inp.readOnly = !editable;
      });
      Array.prototype.forEach.call(itemRowsEl.querySelectorAll(".item-row > button"), function(btn) {
        btn.hidden = !editable;
      });
      if (!editable && db) saveState.textContent = "\uC870\uD68C \uC804\uC6A9\uC774\uC5D0\uC694 -- \uAD00\uB9AC\uC790\uB85C \uB85C\uADF8\uC778\uD558\uBA74 \uC218\uC815\uD560 \uC218 \uC788\uC5B4\uC694";
    }
    function readRows() {
      return Array.prototype.slice.call(itemRowsEl.children).map(function(row) {
        var inputs = row.querySelectorAll("input");
        return {
          name: inputs[0].value.trim(),
          qty: inputs[1].value.trim(),
          threshold: inputs[2].value.trim(),
          expiry: inputs[3].value.trim(),
          lot: inputs[4].value.trim()
        };
      }).filter(function(it) {
        return it.name || it.qty || it.threshold || it.expiry || it.lot;
      });
    }
    function renderRows(items) {
      itemRowsEl.innerHTML = "";
      if (!items || !items.length) {
        itemRowsEl.appendChild(makeRow("", "", "", "", ""));
        return;
      }
      items.forEach(function(it) {
        itemRowsEl.appendChild(makeRow(it.name, it.qty, it.threshold, it.expiry, it.lot));
      });
    }
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var modalGen = 0;
    function closeModal() {
      if (backdrop.hidden) return;
      active = null;
      if (reduceMotion.matches) {
        backdrop.hidden = true;
        return;
      }
      var gen = ++modalGen;
      backdrop.classList.add("closing");
      setTimeout(function() {
        if (gen !== modalGen) return;
        backdrop.hidden = true;
        backdrop.classList.remove("closing");
      }, 160);
    }
    modalClose.addEventListener("click", closeModal);
    backdrop.addEventListener("click", function(e) {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && !backdrop.hidden) closeModal();
    });
    function lastSaved(data) {
      return data && data.updatedAt ? "\uB9C8\uC9C0\uB9C9 \uC218\uC815: " + new Date(data.updatedAt).toLocaleString("ko-KR") : "";
    }
    function openCell(p, index) {
      if (!canEdit()) return;
      var data = stock.shelves[p.id];
      var g = gridOf(p, data);
      active = { mode: "cell", collection: "shelves", id: p.id, index, label: p.label || "\uC120\uBC18", before: cellItems(g.cells[index]), expectedRevision: data && data._revision || 0 };
      modalTitle.textContent = (p.label || "\uC120\uBC18") + " \xB7 " + (Math.floor(index / g.cols) + 1) + "\uB2E8 " + (index % g.cols + 1) + "\uCE78";
      addRowBtn.hidden = false;
      clearBtn.hidden = false;
      itemRowsEl.dataset.mode = "list";
      renderRows(cellItems(g.cells[index]));
      saveState.textContent = db ? lastSaved(data) : "\uC774 \uBBF8\uB9AC\uBCF4\uAE30\uC5D0\uC11C\uB294 \uC800\uC7A5\uC774 \uC9C0\uC6D0\uB418\uC9C0 \uC54A\uC544\uC694";
      applyEditability();
      modalGen++;
      backdrop.classList.remove("closing");
      backdrop.hidden = false;
      var first = itemRowsEl.querySelector("input");
      if (first && canEdit()) first.focus();
    }
    function openList(p) {
      if (!canEdit()) return;
      active = { mode: "list", collection: "pallets", id: p.id, label: p.label || "\uD314\uB808\uD2B8", before: palletItems(p), expectedRevision: stock.pallets[p.id] && stock.pallets[p.id]._revision || 0 };
      modalTitle.textContent = (p.label || "\uD314\uB808\uD2B8") + (p.members && p.members.length > 1 ? " (\uD314\uB808\uD2B8 " + p.members.length + "\uAC1C)" : "");
      addRowBtn.hidden = false;
      clearBtn.hidden = true;
      itemRowsEl.dataset.mode = "list";
      renderRows(palletItems(p));
      saveState.textContent = db ? lastSaved(stock.pallets[p.id]) : "\uC774 \uBBF8\uB9AC\uBCF4\uAE30\uC5D0\uC11C\uB294 \uC800\uC7A5\uC774 \uC9C0\uC6D0\uB418\uC9C0 \uC54A\uC544\uC694";
      applyEditability();
      modalGen++;
      backdrop.classList.remove("closing");
      backdrop.hidden = false;
    }
    function computeThresholdSyncs(rows, skipCollection, skipId) {
      var updates = {};
      rows.forEach(function(it) {
        if (!filled(it) || !it.name || !it.threshold) return;
        var t = parseInt(it.threshold, 10);
        if (!isNaN(t)) updates[lowStockKey(it)] = String(t);
      });
      if (!Object.keys(updates).length) return [];
      function syncItems(items) {
        var changed = false;
        var next = items.map(function(it) {
          var want = updates[lowStockKey(it)];
          if (want === void 0 || String(it.threshold || "") === want) return it;
          changed = true;
          var copy = {};
          for (var k in it) copy[k] = it[k];
          copy.threshold = want;
          return copy;
        });
        return changed ? next : null;
      }
      var synced = [];
      groups.shelf.forEach(function(p) {
        if (skipCollection === "shelves" && skipId === p.id) return;
        var g = gridOf(p, stock.shelves[p.id]);
        var before = [], after = [], changed = false;
        var newCells = g.cells.map(function(cell) {
          var items = cellItems(cell);
          if (!items.length) return cell;
          var next = syncItems(items);
          if (!next) return cell;
          changed = true;
          before = before.concat(items);
          after = after.concat(next);
          return next;
        });
        if (!changed) return;
        synced.push({ collection: "shelves", id: p.id, label: p.label || "\uC120\uBC18", cols: g.cols, cells: newCells, before, after });
      });
      palletUnits.forEach(function(p) {
        if (skipCollection === "pallets" && skipId === p.id) return;
        var items = palletItems(p);
        if (!items.length) return;
        var next = syncItems(items);
        if (!next) return;
        synced.push({ collection: "pallets", id: p.id, label: p.label || "\uD314\uB808\uD2B8", items: next, before: items, after: next });
      });
      return synced;
    }
    function applyThresholdSyncs(synced, batch) {
      synced.forEach(function(s) {
        var updatedAt = Date.now();
        if (s.collection === "shelves") {
          batch.push({ path: "shelves/" + s.id, data: { cols: s.cols, cells: s.cells.map(packCell), updatedAt }, expectedRevision: stock.shelves[s.id] && stock.shelves[s.id]._revision || 0 });
        } else {
          batch.push({ path: "pallets/" + s.id, data: { items: s.items, updatedAt }, expectedRevision: stock.pallets[s.id] && stock.pallets[s.id]._revision || 0 });
        }
      });
    }
    function normalizeThresholds(rows) {
      var chosen = {};
      rows.forEach(function(it) {
        if (!filled(it) || !it.name || !it.threshold) return;
        var t = parseInt(it.threshold, 10);
        if (!isNaN(t)) chosen[lowStockKey(it)] = String(t);
      });
      if (!Object.keys(chosen).length) return rows;
      return rows.map(function(it) {
        if (!filled(it) || !it.name) return it;
        var want = chosen[lowStockKey(it)];
        if (want === void 0 || String(it.threshold || "") === want) return it;
        var copy = {};
        for (var k in it) copy[k] = it[k];
        copy.threshold = want;
        return copy;
      });
    }
    saveBtn.addEventListener("click", function() {
      if (!active || !canEdit()) return;
      if (!db) {
        saveState.textContent = "\uC800\uC7A5\uC774 \uC9C0\uC6D0\uB418\uC9C0 \uC54A\uC544\uC694";
        return;
      }
      var badInput = Array.prototype.find.call(itemRowsEl.querySelectorAll(".qty-input"), function(inp) {
        return !inp.checkValidity();
      });
      if (badInput) {
        badInput.reportValidity();
        return;
      }
      var target = active, rows = normalizeThresholds(readRows()), payload, loc;
      if (target.mode === "cell") {
        var g = gridOf(shelfIndex[target.id], stock.shelves[target.id]);
        g.cells[target.index] = rows.length ? rows : null;
        payload = { cols: g.cols, cells: g.cells, updatedAt: Date.now() };
        loc = target.label + " " + (Math.floor(target.index / g.cols) + 1) + "\uB2E8 " + (target.index % g.cols + 1) + "\uCE78";
      } else {
        payload = { items: rows, updatedAt: Date.now() };
        loc = target.label;
      }
      var synced = computeThresholdSyncs(rows, target.collection, target.id);
      var confirmMsg = loc + " \uC7AC\uACE0\uB97C \uC800\uC7A5\uD560\uAE4C\uC694?";
      if (synced.length) {
        confirmMsg += "\n\n\uAC19\uC740 \uC81C\uD488/\uB85C\uD2B8\uB97C \uC4F0\uB294 \uB2E4\uB978 \uC704\uCE58 " + synced.length + "\uACF3\uC758 \uAE30\uC900\uC218\uB7C9\uB3C4 \uC774 \uAC12\uC73C\uB85C \uD568\uAED8 \uB9DE\uCDB0\uC838\uC694: " + synced.map(function(s) {
          return s.label;
        }).join(", ");
      }
      if (!window.confirm(confirmMsg)) return;
      saveBtn.disabled = true;
      saveState.textContent = "\uC800\uC7A5 \uC911\u2026";
      var firePayload = target.mode === "cell" ? { cols: payload.cols, cells: payload.cells.map(packCell), updatedAt: payload.updatedAt } : payload;
      var batch = [{ path: target.collection + "/" + target.id, data: firePayload, expectedRevision: target.expectedRevision }];
      applyThresholdSyncs(synced, batch);
      refresh();
      InventorySecurity.save(batch).then(function() {
        saveBtn.disabled = false;
        if (active === target) closeModal();
      }).catch(function(error) {
        saveBtn.disabled = false;
        if (active === target) saveState.textContent = error.message;
      });
    });
    clearBtn.addEventListener("click", function() {
      if (!canEdit()) return;
      renderRows([]);
      saveBtn.click();
    });
    function setCols(p, cols) {
      if (!db || !canResize() || cols < 1 || cols > MAX_COLS) return;
      var g = gridOf(p, stock.shelves[p.id]);
      var beforeCols = g.cols;
      var next = [];
      for (var r = 0; r < GRID_ROWS; r++)
        for (var c = 0; c < cols; c++)
          next.push(c < g.cols ? g.cells[r * g.cols + c] || null : null);
      var payload = { cols, cells: next, updatedAt: Date.now() };
      InventorySecurity.save([{
        path: "shelves/" + p.id,
        data: { cols, cells: next.map(packCell), updatedAt: payload.updatedAt },
        expectedRevision: stock.shelves[p.id] && stock.shelves[p.id]._revision || 0
      }]).catch(function(error) {
        alert(error.message);
      });
    }
    var tabs = { plan: document.getElementById("tabPlan"), stock: document.getElementById("tabStock") };
    var panels = { plan: document.getElementById("panelPlan"), stock: document.getElementById("panelStock") };
    var stockGrid = document.getElementById("stockGrid");
    var stockSearch = document.getElementById("stockSearch");
    var showEmptyEl = document.getElementById("showEmpty");
    var stockSummary = document.getElementById("stockSummary");
    var lowStockChip = document.getElementById("lowStockChip");
    var lowStockOnly = false;
    function syncLowStockChip() {
      lowStockChip.setAttribute("aria-pressed", String(lowStockOnly));
    }
    lowStockChip.addEventListener("click", function() {
      lowStockOnly = !lowStockOnly;
      syncLowStockChip();
      renderStock();
    });
    function setTab(name) {
      Object.keys(panels).forEach(function(k) {
        panels[k].hidden = k !== name;
        tabs[k].setAttribute("aria-selected", String(k === name));
      });
    }
    tabs.plan.addEventListener("click", function() {
      setTab("plan");
    });
    tabs.stock.addEventListener("click", function() {
      setTab("stock");
    });
    function h(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    function catTint(label) {
      var m = CATEGORY_FILL.filter(function(c) {
        return label && label.indexOf(c.prefix) === 0;
      })[0];
      return m ? m.fill : "var(--border)";
    }
    function cellButton(p, g, i) {
      var items = cellItems(g.cells[i]);
      var row = Math.floor(i / g.cols) + 1, col = i % g.cols + 1;
      var b = h("button", "cell");
      b.type = "button";
      var pos = h("span", "pos", row + "-" + col + (items.length > 1 ? " \xB7 " + items.length + "\uAC74" : ""));
      b.appendChild(pos);
      if (items.length) {
        items.forEach(function(it) {
          var line = h("div", "cell-item");
          var low = isLowStock(it);
          line.appendChild(h("span", "nm" + (low ? " stock-low" : ""), (low ? "\u26A0 " : "") + (it.name || "(\uC774\uB984 \uC5C6\uC74C)")));
          var sub = [];
          if (it.qty) sub.push(it.qty);
          if (it.lot) sub.push(it.lot);
          if (sub.length) line.appendChild(h("span", "sub", sub.join(" \xB7 ")));
          if (it.expiry) line.appendChild(h("span", "sub " + expiryClass(it.expiry), it.expiry));
          b.appendChild(line);
        });
      } else {
        b.classList.add("empty");
        b.appendChild(h("span", null, "+"));
      }
      b.title = (p.label || "\uC120\uBC18") + " " + row + "\uB2E8 " + col + "\uCE78 \u2014 " + (items.length ? "\uD074\uB9AD\uD574\uC11C \uC218\uC815\xB7\uCD94\uAC00" : "\uD074\uB9AD\uD574\uC11C \uC81C\uD488 \uB4F1\uB85D");
      b.addEventListener("click", function() {
        openCell(p, i);
      });
      return b;
    }
    function shelfCard(p) {
      var g = gridOf(p, stock.shelves[p.id]);
      var n = cellCount(g.cells);
      var card = h("div", "stock-card" + (n ? "" : " is-empty"));
      card.id = "card-shelves-" + p.id;
      var tint = h("div", "stock-tint");
      tint.style.background = catTint(p.label);
      card.appendChild(tint);
      var head = h("div", "stock-head");
      head.appendChild(h("b", null, p.label || "\uC120\uBC18"));
      head.appendChild(h("span", "n", n + "\uAC74 \xB7 " + usedCells(g.cells) + "/" + GRID_ROWS * g.cols + "\uCE78"));
      var step = h("div", "col-step spacer");
      if (canResize()) {
        var minus = h("button", null, "\u2212");
        minus.type = "button";
        var lastColUsed = g.cells.some(function(c, i2) {
          return cellItems(c).length && i2 % g.cols === g.cols - 1;
        });
        minus.disabled = !db || g.cols <= 1 || lastColUsed;
        minus.title = lastColUsed ? "\uB9C8\uC9C0\uB9C9 \uCE78\uC5D0 \uC81C\uD488\uC774 \uC788\uC5B4 \uC904\uC77C \uC218 \uC5C6\uC5B4\uC694" : "\uCE78 \uC904\uC774\uAE30";
        minus.addEventListener("click", function() {
          setCols(p, g.cols - 1);
        });
        var plus = h("button", null, "+");
        plus.type = "button";
        plus.disabled = !db || g.cols >= MAX_COLS;
        plus.title = "\uCE78 \uB298\uB9AC\uAE30";
        plus.addEventListener("click", function() {
          setCols(p, g.cols + 1);
        });
        step.appendChild(minus);
      }
      step.appendChild(h("span", null, GRID_ROWS + " \xD7 " + g.cols));
      if (canResize()) step.appendChild(plus);
      head.appendChild(step);
      card.appendChild(head);
      var scroll = h("div", "cell-scroll");
      var grid = h("div", "cell-grid");
      grid.style.gridTemplateColumns = "repeat(" + g.cols + ", minmax(92px, 1fr))";
      for (var i = 0; i < g.cells.length; i++) grid.appendChild(cellButton(p, g, i));
      scroll.appendChild(grid);
      card.appendChild(scroll);
      return card;
    }
    function palletCard(p) {
      var items = palletItems(p);
      var card = h("div", "stock-card" + (items.length ? "" : " is-empty"));
      card.id = "card-pallets-" + p.id;
      card.appendChild(h("div", "stock-tint"));
      var head = h("div", "stock-head");
      head.appendChild(h("b", null, p.label || "\uD314\uB808\uD2B8"));
      head.appendChild(h("span", "n", items.length + "\uAC1C" + (p.members.length > 1 ? " \xB7 \uD314\uB808\uD2B8 " + p.members.length + "\uAC1C" : "")));
      var edit = h("button", "edit-link spacer", canEdit() ? "\uD3B8\uC9D1" : "\uBCF4\uAE30");
      edit.type = "button";
      edit.addEventListener("click", function() {
        openList(p);
      });
      head.appendChild(edit);
      card.appendChild(head);
      if (!items.length) {
        card.appendChild(h("div", "list-empty", "\uB4F1\uB85D\uB41C \uC81C\uD488\uC774 \uC5C6\uC5B4\uC694"));
      } else {
        var list = h("div", "list-items");
        items.forEach(function(it) {
          var row = h("div", "list-item");
          var low = isLowStock(it);
          row.appendChild(h("span", low ? "stock-low" : null, (low ? "\u26A0 " : "") + (it.name || "(\uC774\uB984 \uC5C6\uC74C)")));
          var sub = [];
          if (it.qty) sub.push(it.qty);
          if (it.lot) sub.push(it.lot);
          if (it.expiry) sub.push(it.expiry);
          row.appendChild(h("span", "sub " + (it.expiry ? expiryClass(it.expiry) : ""), sub.join(" \xB7 ")));
          list.appendChild(row);
        });
        card.appendChild(list);
      }
      return card;
    }
    var CATEGORY_ORDER = ["\uC81C\uD488", "\uBD80\uC790\uC7AC", "\uAE30\uACC4\uD300"];
    function shelfRank(label) {
      for (var i = 0; i < CATEGORY_ORDER.length; i++)
        if ((label || "").indexOf(CATEGORY_ORDER[i]) === 0) return i;
      return CATEGORY_ORDER.length;
    }
    function byShelfOrder(a, b) {
      var ra = shelfRank(a.label), rb = shelfRank(b.label);
      if (ra !== rb) return ra - rb;
      return (a.label || "").localeCompare(b.label || "", "ko", { numeric: true });
    }
    function itemMatchesQuery(it, q) {
      return (it.name || "").toLowerCase().indexOf(q) !== -1 || (it.lot || "").toLowerCase().indexOf(q) !== -1;
    }
    function matches(q, label, entries) {
      if (!q) return true;
      if ((label || "").toLowerCase().indexOf(q) !== -1) return true;
      return entries.some(function(c) {
        return filled(c) && itemMatchesQuery(c, q);
      });
    }
    function renderStock() {
      var q = (stockSearch.value || "").trim().toLowerCase();
      var showEmpty = showEmptyEl.checked;
      stockGrid.innerHTML = "";
      var shown = 0, products = 0, usedLocations = 0;
      var qLocations = 0, qEntries = 0;
      function countHits(items) {
        if (!q && !lowStockOnly) return 0;
        return items.filter(function(it) {
          if (!filled(it)) return false;
          if (lowStockOnly && !isLowStock(it)) return false;
          if (q && !itemMatchesQuery(it, q)) return false;
          return true;
        }).length;
      }
      function cardVisible(label, items) {
        if (lowStockOnly) {
          return items.some(function(it) {
            return isLowStock(it) && (!q || itemMatchesQuery(it, q));
          });
        }
        return matches(q, label, items);
      }
      groups.shelf.slice().sort(byShelfOrder).forEach(function(p) {
        var cells = gridOf(p, stock.shelves[p.id]).cells;
        var items = cells.reduce(function(acc, c) {
          return acc.concat(cellItems(c));
        }, []);
        products += items.length;
        if (items.length) usedLocations++;
        var hits = countHits(items);
        if (hits) {
          qLocations++;
          qEntries += hits;
        }
        if (!items.length && !showEmpty || !cardVisible(p.label, items)) return;
        stockGrid.appendChild(shelfCard(p));
        shown++;
      });
      palletUnits.slice().sort(function(a, b) {
        return (a.label || "").localeCompare(b.label || "", "ko", { numeric: true });
      }).forEach(function(p) {
        var items = palletItems(p);
        products += items.length;
        if (items.length) usedLocations++;
        var hits = countHits(items);
        if (hits) {
          qLocations++;
          qEntries += hits;
        }
        if (!items.length && !showEmpty || !cardVisible(p.label, items)) return;
        stockGrid.appendChild(palletCard(p));
        shown++;
      });
      if (!shown) {
        stockGrid.appendChild(h("div", "stock-blank", db ? "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uC704\uCE58\uAC00 \uC5C6\uC5B4\uC694" : "\uC774 \uBBF8\uB9AC\uBCF4\uAE30\uC5D0\uC11C\uB294 \uC800\uC7A5\uB41C \uC7AC\uACE0\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC5B4\uC694"));
      }
      stockSummary.textContent = q || lowStockOnly ? (lowStockOnly ? "\uC7AC\uACE0 \uBD80\uC871 \xB7 " : "\uAC80\uC0C9 \uACB0\uACFC \xB7 ") + "\uC704\uCE58 " + qLocations + "\uACF3 \xB7 \uC81C\uD488 " + qEntries + "\uAC74" : "\uC704\uCE58 " + usedLocations + "\uACF3 \xB7 \uC81C\uD488 " + products + "\uAC74";
    }
    stockSearch.addEventListener("input", renderStock);
    showEmptyEl.addEventListener("change", renderStock);
    function focusCard(collection, id) {
      setTab("stock");
      var card = document.getElementById("card-" + collection + "-" + id);
      if (!card) {
        stockSearch.value = "";
        showEmptyEl.checked = true;
        renderStock();
        card = document.getElementById("card-" + collection + "-" + id);
      }
      if (!card) return;
      card.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
      card.classList.add("flash");
      setTimeout(function() {
        card.classList.remove("flash");
      }, 1400);
    }
    function makeInteractive(rect, label, onActivate) {
      rect.setAttribute("tabindex", "0");
      rect.setAttribute("role", "button");
      rect.setAttribute("aria-label", label);
      rect.addEventListener("click", onActivate);
      rect.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          onActivate();
        }
      });
    }
    groups.shelf.forEach(function(p) {
      var shelfLabel = p.label || "\uC120\uBC18";
      p._rect.classList.add("shelf-rect");
      var title = el("title", {});
      title.textContent = shelfLabel + (p._uncertainMatch ? " (\u26A0 \uB77C\uBCA8 \uB9E4\uCE6D \uBD88\uD655\uC2E4 - \uC704\uCE58 \uD655\uC778 \uD544\uC694)" : "") + " \u2014 \uD074\uB9AD\uD574\uC11C \uCE78\uBCC4 \uC7AC\uACE0 \uBCF4\uAE30";
      p._rect.appendChild(title);
      makeInteractive(p._rect, title.textContent, function() {
        focusCard("shelves", p.id);
      });
    });
    groups.pallet.forEach(function(p) {
      p._rect.classList.add("shelf-rect");
      var title = el("title", {});
      var clusterNote = p._unit.members.length > 1 ? " (" + p._unit.label + ")" : "";
      title.textContent = (p.label || "\uD314\uB808\uD2B8") + clusterNote + (p._uncertainMatch ? " (\u26A0 \uB77C\uBCA8 \uB9E4\uCE6D \uBD88\uD655\uC2E4 - \uC704\uCE58 \uD655\uC778 \uD544\uC694)" : "") + " \u2014 \uD074\uB9AD\uD574\uC11C \uC81C\uD488 \uAD00\uB9AC";
      p._rect.appendChild(title);
      makeInteractive(p._rect, title.textContent, function() {
        openList(p._unit);
      });
    });
    var statsRow = document.getElementById("statsRow");
    var totalLocations = groups.shelf.length + palletUnits.length;
    function countLowStock() {
      var n = 0;
      groups.shelf.forEach(function(p) {
        gridOf(p, stock.shelves[p.id]).cells.forEach(function(c) {
          cellItems(c).forEach(function(it) {
            if (isLowStock(it)) n++;
          });
        });
      });
      palletUnits.forEach(function(p) {
        palletItems(p).forEach(function(it) {
          if (isLowStock(it)) n++;
        });
      });
      return n;
    }
    function renderStats() {
      var registered = groups.shelf.filter(function(p) {
        return countOf(p, "shelves");
      }).length + palletUnits.filter(function(p) {
        return countOf(p, "pallets");
      }).length;
      var low = countLowStock();
      statsRow.innerHTML = "";
      var chip = document.createElement("div");
      chip.className = "stat-chip";
      chip.innerHTML = '<b class="num">' + registered + " / " + totalLocations + "</b><span>\uC704\uCE58 \uB4F1\uB85D\uB428</span>";
      statsRow.appendChild(chip);
      var lowChip = document.createElement("button");
      lowChip.type = "button";
      lowChip.className = "stat-chip stat-chip-btn" + (low ? " stat-chip-warn" : "");
      lowChip.disabled = !low;
      lowChip.innerHTML = '<b class="num">' + low + "</b><span>\uC7AC\uACE0 \uBD80\uC871</span>";
      lowChip.addEventListener("click", function() {
        if (!low) return;
        lowStockOnly = true;
        stockSearch.value = "";
        syncLowStockChip();
        setTab("stock");
        renderStock();
      });
      statsRow.appendChild(lowChip);
    }
    function refresh() {
      buildLowStockGroups();
      renderStats();
      renderStock();
    }
    refresh();
    var firebaseConfig = {
      apiKey: "AIzaSyDHSvdVLhkOHWs1whqkJ4pyol69S6P5C4M",
      authDomain: "warehouse-inventory-84fef.firebaseapp.com",
      projectId: "warehouse-inventory-84fef",
      storageBucket: "warehouse-inventory-84fef.firebasestorage.app",
      messagingSenderId: "148799748197",
      appId: "1:148799748197:web:01f8b6022b7e471e306e8c"
    };
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    refresh();
    var authBox = document.getElementById("authBox");
    var loginBackdrop = document.getElementById("loginBackdrop");
    var loginForm = document.getElementById("loginForm");
    var loginEmail = document.getElementById("loginEmail");
    var loginPassword = document.getElementById("loginPassword");
    var loginError = document.getElementById("loginError");
    var loginSubmit = document.getElementById("loginSubmit");
    var loginClose = document.getElementById("loginClose");
    function openLoginModal() {
      loginError.textContent = "";
      loginForm.reset();
      loginBackdrop.hidden = false;
      loginEmail.focus();
    }
    function closeLoginModal() {
      loginPassword.value = "";
      loginBackdrop.hidden = true;
    }
    loginClose.addEventListener("click", closeLoginModal);
    loginBackdrop.addEventListener("click", function(e) {
      if (e.target === loginBackdrop) closeLoginModal();
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && !loginBackdrop.hidden) closeLoginModal();
    });
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      loginSubmit.disabled = true;
      loginError.textContent = "";
      auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value).then(function() {
        loginSubmit.disabled = false;
        closeLoginModal();
      }).catch(function() {
        loginSubmit.disabled = false;
        loginError.textContent = "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC544\uC694";
      });
    });
    var auditBackdrop = document.getElementById("auditBackdrop");
    var auditClose = document.getElementById("auditClose");
    var auditList = document.getElementById("auditList");
    function closeAuditModal() {
      auditBackdrop.hidden = true;
    }
    auditClose.addEventListener("click", closeAuditModal);
    auditBackdrop.addEventListener("click", function(e) {
      if (e.target === auditBackdrop) closeAuditModal();
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && !auditBackdrop.hidden) closeAuditModal();
    });
    function openAuditModal() {
      auditList.innerHTML = "";
      auditList.appendChild(h("div", "list-empty", "\uBD88\uB7EC\uC624\uB294 \uC911\u2026"));
      auditBackdrop.hidden = false;
      db.collection("auditLog").orderBy("ts", "desc").limit(200).get().then(function(snap) {
        auditList.innerHTML = "";
        if (snap.empty) {
          auditList.appendChild(h("div", "list-empty", "\uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694"));
          return;
        }
        var list = h("div", "list-items");
        snap.forEach(function(doc) {
          var d = doc.data();
          var when = d.ts && d.ts.toDate ? d.ts.toDate().toLocaleString("ko-KR") : "";
          var row = h("div", "list-item");
          row.appendChild(h("span", null, (d.by || "") + " \xB7 " + (d.location || "") + " \xB7 " + d.before + " \u2192 " + d.after));
          row.appendChild(h("span", "sub", when));
          list.appendChild(row);
        });
        auditList.appendChild(list);
      }).catch(function() {
        auditList.innerHTML = "";
        auditList.appendChild(h("div", "list-empty", "\uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694"));
      });
    }
    function renderAuthBox() {
      authBox.innerHTML = "";
      if (myEmail) {
        var tierLabel = myTier === 2 ? "2\uB2E8\uACC4 \uAD00\uB9AC\uC790" : myTier === 1 ? "1\uB2E8\uACC4 \uAD00\uB9AC\uC790" : "\uAD8C\uD55C \uC5C6\uC74C";
        authBox.appendChild(h("span", null, myEmail + " \xB7 " + tierLabel));
        if (myTier === 2) {
          var logBtn = h("button", "auth-link", "\uBCC0\uACBD \uC774\uB825");
          logBtn.type = "button";
          logBtn.addEventListener("click", openAuditModal);
          authBox.appendChild(logBtn);
        }
        var out = h("button", "auth-link", "\uB85C\uADF8\uC544\uC6C3");
        out.type = "button";
        out.addEventListener("click", function() {
          auth.signOut();
        });
        authBox.appendChild(out);
      } else {
        var btn = h("button", "auth-link", "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778");
        btn.type = "button";
        btn.addEventListener("click", openLoginModal);
        authBox.appendChild(btn);
      }
    }
    var subscriptions = [], roleKey = "", identityGeneration = 0;
    var accessNotice = document.createElement("p");
    accessNotice.setAttribute("role", "status");
    document.querySelector("header").after(accessNotice);
    function clearPrivateView() {
      subscriptions.forEach(function(stop) {
        stop();
      });
      subscriptions = [];
      stock = { shelves: {}, pallets: {} };
      active = null;
      backdrop.hidden = true;
      auditBackdrop.hidden = true;
      auditList.textContent = "";
      itemRowsEl.textContent = "";
      refresh();
    }
    InventorySecurity.start(firebase.app(), function(identity) {
      var key = identity.user ? identity.user.uid + ":" + identity.tier : "";
      myEmail = identity.user ? identity.user.email : null;
      myTier = identity.tier;
      renderAuthBox();
      document.body.classList.toggle("inventory-locked", myTier < 1);
      accessNotice.textContent = identity.error ? "\uAD8C\uD55C \uD655\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694." : !identity.ready ? "\uAD8C\uD55C\uC744 \uD655\uC778\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4." : myTier < 1 ? "\uC2B9\uC778\uB41C \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD558\uBA74 \uC7AC\uACE0\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." : "";
      if (key === roleKey) return;
      roleKey = key;
      var generation = ++identityGeneration;
      clearPrivateView();
      if (myTier < 1) return;
      ["shelves", "pallets"].forEach(function(collection) {
        subscriptions.push(db.collection(collection).onSnapshot(function(snap) {
          if (generation !== identityGeneration) return;
          var next = {};
          snap.docs.forEach(function(doc) {
            var data = doc.data() || {};
            if (collection === "shelves" && Array.isArray(data.cells))
              data = { cols: data.cols, cells: data.cells.map(unpackCell), updatedAt: data.updatedAt, _revision: data._revision || 0 };
            next[doc.id] = data;
          });
          stock[collection] = next;
          refresh();
        }, function() {
          ++identityGeneration;
          clearPrivateView();
          myTier = 0;
          renderAuthBox();
          document.body.classList.add("inventory-locked");
          accessNotice.textContent = "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694.";
        }));
      });
    });
  })();
})();
