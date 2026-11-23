  // --- rfRF (2026-11-23, head; user: the rounded end of a slot wrapped through a tube wall shaded as flat strips and
  // each strip lit and picked alone) --- a slot debossed through a tube wall (Wrap), looked at from below so the wall
  // of its upper rounded end faces the viewer: real clicks on two different strips of that wall select one and the
  // same face, hover lights it whole, and its shading normals turn smoothly from one end of the arc to the other. On
  // OpenCascade the rounded end is one true face of the 8 the part has (it does not take the flat walls with it); on
  // Anvil's own kernel the walls joined by tangent edges are one face.
  (function () {
    var CODE = 'p.units("in");\np.sketch("Top").circle(0, 0, 1).circle(0, 0, 0.8).end().extrude(3);\n' +
      'p.sketch("Front", 1).slot(0, 1, 0, 2, 0.6).end().wrap({ face: [0, 1.5, 1], mode: "deboss", thickness: 0.3 });\n';
    function ev(type, p, target) {
      var r = $('viewport').getBoundingClientRect();
      (target || W).dispatchEvent(new W.MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'mouseup' ? 0 : 1, clientX: Math.round(r.left + p[0]), clientY: Math.round(r.top + p[1]) }));
    }
    function click(p) { ev('mousemove', p); ev('mousedown', p, $('viewport')); ev('mouseup', p); }
    function occReady() { return Promise.race([anvil.occtIdle(), wait(60000).then(function () { return anvil.occt(); })]); }
    // the Wrap's mesh faces on the upper rounded end (above the arc's centre, y = 2) that are under the cursor at their
    // own centroid, 8 px clear of every edge
    function endFacets(wid) {
      var m = UI.App.mesh, out = [];
      m.faces.forEach(function (f, i) {
        var p = f.polys && f.polys[0], c = f.centroid;
        if (!p || p.shared !== wid || !c || c[1] < 2.02) return;
        var s = UI.worldToScreen(c), pk = UI.pickFace(s[0], s[1]);
        if (s[0] < 20 || s[1] < 20 || s[0] > UI.size.w - 20 || s[1] > UI.size.h - 20 || !pk || pk.index !== i) return;
        if (![[0, 0], [8, 0], [-8, 0], [0, 8], [0, -8]].every(function (o) { return !UI.pickEdge(s[0] + o[0], s[1] + o[1]); })) return;
        out.push(i);
      });
      return out;
    }
    async function check(eng, wid) {
      var m, vis = [], tries = [[0, -70], [0, 70], [0, -110], [0, 110]];
      for (var t = 0; t < tries.length && vis.length < 3; t++) {
        UI.setView('Front'); if (UI.finishViewAnimation) UI.finishViewAnimation();
        UI.rotateView(tries[t][0], tries[t][1]); UI.zoomToFit(); if (UI.finishViewAnimation) UI.finishViewAnimation();
        var z = UI.worldToScreen([0, 2.15, 0.9]); UI.zoomToArea(z[0], z[1], 1 / 4); if (UI.finishViewAnimation) UI.finishViewAnimation();
        UI.zoomTess.now(); await idle();
        vis = endFacets(wid);
      }
      m = UI.App.mesh;
      assert(vis.length >= 3, eng + ': strips of the rounded end facing the viewer: ' + vis.length);
      // the two strips furthest apart along the arc (x)
      vis.sort(function (a, b) { return m.faces[a].centroid[0] - m.faces[b].centroid[0]; });
      var a = vis[0], b = vis[vis.length - 1], keys = [];
      assert(Math.abs(m.faces[a].centroid[0] - m.faces[b].centroid[0]) > 0.1, eng + ': the two strips are apart on the arc');
      UI.setSelection([]);
      for (var k = 0; k < 2; k++) {
        click(UI.worldToScreen(m.faces[k ? b : a].centroid)); await idle();
        var sel = anvil.selection();
        assert(sel.length === 1 && sel[0].kind === 'face', eng + ': click ' + k + ' selected ' + JSON.stringify(sel.map(function (x) { return x.kind + x.index; })));
        keys.push(UI.faceGroup(sel[0].index)[0]);
        UI.setSelection([]);
      }
      assert(keys[0] === keys[1], eng + ': two strips of the rounded end are two faces (' + keys.join(', ') + ')');
      var grp = UI.faceGroup(keys[0]);
      vis.forEach(function (i) { assert(grp.indexOf(i) >= 0, eng + ': strip ' + i + ' of the rounded end is not in the picked face'); });
      ev('mousemove', UI.worldToScreen(m.faces[a].centroid)); await wait(30);
      var hv = UI.App.hover;
      assert(hv && hv.kind === 'face' && UI.faceGroup(hv.index)[0] === keys[0], eng + ': hover ' + JSON.stringify(hv && { kind: hv.kind, index: hv.index }));
      // the status line gives the area of the face lit, not of one strip
      var want = 0, said = /area ([-\d.]+)/.exec($('status-coords').textContent || '');
      grp.forEach(function (i) { want += m.faces[i].area; });
      assert(said && Math.abs(+said[1] - want) < 6e-4 && +said[1] > 5 * m.faces[a].area, eng + ': the status line says "' + $('status-coords').textContent + '", the face lit has area ' + want);
      // smooth shading: the normals drawn at the two far strips differ (the wall turns), and no strip is drawn flat
      // while its neighbour is turned: every strip's corner normals spread (a flat strip's are all its own normal)
      var SN = UI.analyticNormals(m), flat = 0;
      vis.forEach(function (i) {
        var f = m.faces[i], lo = [1, 1, 1], hi = [-1, -1, -1];
        for (var q = f.start * 9; q < (f.start + f.count) * 9; q++) { lo[q % 3] = Math.min(lo[q % 3], SN[q]); hi[q % 3] = Math.max(hi[q % 3], SN[q]); }
        if (Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) < 1e-4) flat++;
      });
      assert(flat === 0, eng + ': ' + flat + ' of ' + vis.length + ' strips of the rounded end are shaded flat');
      return { faces: grp, n: vis.length };
    }
    step('rfRF: the rounded end of a slot wrapped through a tube wall is one face: clicks on two of its strips select the same face, hover lights it, it shades smooth; OpenCascade builds it as one true face of 8', async function () {
      var th = UI.theme(), V = UI.App.view, st = V.style, errs0 = errors.length, out = [];
      try {
        await anvil.newPart(); await idle();
        anvil.occt(false, { remember: false });
        var r = await anvil.run(CODE); await idle();
        assert(!(r && r.error), 'the part builds: ' + (r && r.error));
        var wid = UI.App.model.features.filter(function (f) { return f.type === 'wrap'; })[0].id;
        UI.setStyle('shadedEdges');
        var A = await check('Anvil', wid);
        out.push('Anvil: ' + A.n + ' strips -> one face of ' + A.faces.length + ' mesh faces');
        anvil.occt(true, { remember: false });
        var s = await occReady();
        if (s.state === 'failed' || s.state === 'off' || !s.driving) out.push('OpenCascade skipped: ' + (s.error || s.state));
        else {
          await idle();
          assert(s.faces === 8, 'OpenCascade: ' + s.faces + ' faces, want 8 (the tube\'s 4 and the slot\'s 4 walls)');
          var O = await check('OpenCascade', wid), m = UI.App.mesh;
          O.faces.forEach(function (i) { assert(m.faces[i].centroid[1] > 1.99, 'OpenCascade: the rounded end\'s face takes in a piece of a flat wall (y ' + m.faces[i].centroid[1] + ')'); });
          out.push('OpenCascade: 8 faces, ' + O.n + ' strips -> one face of ' + O.faces.length + ' mesh faces');
        }
        assert(errors.length === errs0, 'errors: ' + errors.slice(errs0).join(' | '));
        return out.join('; ');
      } finally { UI.setSelection([]); anvil.occt(false, { remember: false }); await idle(); UI.setStyle(st); if (th) UI.setTheme(th); }
    });
  })();
