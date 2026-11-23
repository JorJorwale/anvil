  // --- rfRF (2026-11-23, head; user: the rounded end of a slot wrapped through a tube wall shaded and picked as a
  // strip per chord, "i wanted general fix") --- OpenCascade draws every curved piece of a wrapped outline as one true
  // edge, so its wall is one face: an arc or circle on a cylinder exactly (an ellipse in (θ, z); the volume is the
  // analytic one: the contour's area in the sketch, per unit of radius, times the annulus the wrap goes through), an
  // ellipse or spline, a glyph of Sketch Text (arcs turning both ways), anything on a cone (a line's image is curved
  // there) and on a flat face the sketch is not parallel to (an arc projects to an ellipse) as the cubic through its
  // points. Anvil's own wrap keeps the chords, so the volume check against it is the loose one (tolerance 2e-2).
  // Each row: every feature ok, a valid solid, the number of B-rep faces (a strip per chord gave 39 to 311), and the
  // volume: the exact one where there is one (`tol`, 1e-6 unless given), else Anvil's to 1e-4.
  var RF_TUBE = 'p.units("in");\np.sketch("Top").circle(0, 0, 1).circle(0, 0, 0.8).end().extrude(3);\n', RF_ROD = 'p.units("in");\np.sketch("Top").circle(0, 0, 1).end().extrude(3);\n';
  var RF_WEDGE = 'p.units("in");\np.sketch("Front").line(0, 0, 4, 0).line(4, 0, 4, 1).line(4, 1, 0, 2).line(0, 2, 0, 0).end().extrude(3);\n', RF_COS = 4 / Math.sqrt(17);
  var RF_VT = Math.PI * (1 - 0.64) * 3, RF_VR = Math.PI * 3, RF_SLOT = 2 * 0.3 * 1 + Math.PI * 0.09, RF_CIRC = Math.PI * 0.09;
  // a sketch on the plane tangent to a 10° drafted cone (the Ø2 circle extruded 3) and its Wrap
  function rfCone(ents, mode) {
    return function (m) {
      var t = Math.tan(10 * Math.PI / 180), q = Math.hypot(1, t);
      m.features.push({ id: m.nextId++, type: 'sketch', name: 'Sketch2', plane: { custom: true, origin: [0, 0, 1], x: [1, 0, 0], y: [0, 1 / q, -t / q], n: [0, t / q, 1 / q] }, entities: ents });
      m.features.push({ id: m.nextId++, type: 'wrap', name: 'Wrap1', sketch: m.nextId - 2, face: [0, 1, 1 - t], mode: mode, thickness: 0.05 });
    };
  }
  var RF_CONE = 'p.units("in");\np.sketch("Top").circle(0, 0, 1).end().extrude(3, { draft: 10 });\n';
  var RF_CASES = [
    { name: 'a 0.6 wide slot debossed through the wall of a Ø2 × Ø1.6 tube: 4 wall faces (two flat, two rounded ends)', code: RF_TUBE + 'p.sketch("Front", 1).slot(0, 1, 0, 2, 0.6).end().wrap({ face: [0, 1.5, 1], mode: "deboss", thickness: 0.3 });', want: RF_VT - RF_SLOT * (1 - 0.64) / 2, faces: 8 },
    { name: 'a Ø0.6 circle debossed through the same wall: 1 wall face', code: RF_TUBE + 'p.sketch("Front", 1).circle(0, 1.5, 0.3).end().wrap({ face: [0, 1.5, 1], mode: "deboss", thickness: 0.3 });', want: RF_VT - RF_CIRC * (1 - 0.64) / 2, faces: 5 },
    { name: 'the slot embossed 0.1 on a Ø2 rod: 4 wall faces and the top', code: RF_ROD + 'p.sketch("Front", 1).slot(0, 1, 0, 2, 0.6).end().wrap({ face: [0, 1.5, 1], mode: "emboss", thickness: 0.1 });', want: RF_VR + RF_SLOT * (1.21 - 1) / 2, faces: 8 },
    { name: 'the slot scribed on the rod (one face more, same volume)', code: RF_ROD + 'p.sketch("Front", 1).slot(0, 1, 0, 2, 0.6).end().wrap({ face: [0, 1.5, 1], mode: "scribe" });', want: RF_VR, faces: 4 },
    { name: 'a 1.0 × 0.6 ellipse debossed through the tube wall: 1 wall face', code: RF_TUBE + 'p.sketch("Front", 1).ellipse(0, 1.5, 0.5, 0.3, 0).end().wrap({ face: [0, 1.5, 1], mode: "deboss", thickness: 0.3 });', want: RF_VT - Math.PI * 0.15 * (1 - 0.64) / 2, tol: 1e-5, faces: 5 },
    { name: 'the ellipse turned 30° and embossed 0.1 on the rod: the wall and the top', code: RF_ROD + 'p.sketch("Front", 1).ellipse(0, 1.5, 0.5, 0.3, 30).end().wrap({ face: [0, 1.5, 1], mode: "emboss", thickness: 0.1 });', want: RF_VR + Math.PI * 0.15 * (1.21 - 1) / 2, tol: 1e-5, faces: 5 },
    { name: 'a contour of a spline and three lines debossed 0.1 on the rod: 4 wall faces and the floor', code: RF_ROD + 'p.sketch("Front", 1).spline([[-0.5, 1], [-0.2, 1.6], [0.2, 1.3], [0.5, 2]]).line(0.5, 2, 0.5, 0.8).line(0.5, 0.8, -0.5, 0.8).line(-0.5, 0.8, -0.5, 1).end().wrap({ face: [0, 1.5, 1], mode: "deboss", thickness: 0.1 });', want: null, faces: 8 },
    { name: 'Sketch Text "SO8" embossed 0.05 on the rod (arcs turning both ways, two counters in the 8): 33 faces', code: RF_ROD + 'p.sketch("Front", 1).text(-0.6, 1.1, "SO8", { h: 0.4, mode: "outline" }).end().wrap({ face: [0, 1.25, 1], mode: "emboss", thickness: 0.05 });', want: null, faces: 33 },
    { name: 'a 0.5 wide slot debossed 0.05 on a 10° cone: 4 wall faces and the floor', code: RF_CONE, more: rfCone([{ t: 'slot', x1: 0, y1: 0.6, x2: 0, y2: 1.4, w: 0.5 }], 'deboss'), want: null, faces: 8 },
    { name: 'a 0.6 × 0.8 rectangle debossed 0.05 on the cone (its sides are curved there): 4 wall faces and the floor', code: RF_CONE, more: rfCone([{ t: 'rect', x: -0.3, y: 0.5, w: 0.6, h: 0.8 }], 'deboss'), want: null, faces: 8 },
    { name: 'a Ø0.6 circle embossed 0.05 on the cone: the wall and the top', code: RF_CONE, more: rfCone([{ t: 'circle', cx: 0, cy: 1, r: 0.3 }], 'emboss'), want: null, faces: 5 },
    { name: 'a Ø1 circle embossed 0.1 on the slanted top of a wedge (the sketch is level): the wall and the top', code: RF_WEDGE + 'p.sketch("Top", 3).circle(2, -1.5, 0.5).end().wrap({ face: [2, 1.5, 1.5], mode: "emboss", thickness: 0.1 });', want: 18 + Math.PI * 0.25 * RF_COS * 0.1, faces: 8 },
    { name: 'a 0.6 wide slot debossed 0.1 on the slanted top: 4 wall faces and the floor', code: RF_WEDGE + 'p.sketch("Top", 3).slot(1.5, -1.5, 2.5, -1.5, 0.6).end().wrap({ face: [2, 1.5, 1.5], mode: "deboss", thickness: 0.1 });', want: 18 - RF_SLOT * RF_COS * 0.1, tol: 2e-6, faces: 11 }
  ];
  for (var rfc of RF_CASES) {
    var rfName = 'rfRF Wrap, one face per curve of the outline: ' + rfc.name;
    try {
      var trf = performance.now(), mrf = K.newModel('T'); K.runScript(mrf, rfc.code);
      if (rfc.more) rfc.more(mrf);
      var arf = K.rebuild(JSON.parse(JSON.stringify(mrf))), avrf = K.massProps(K.meshFromBody(arf.body), 1).volume;
      var rrf = await occt(JSON.parse(JSON.stringify(mrf)), { noCache: true }), whyRF = [];
      if (Object.keys(arf.errors).length) whyRF.push('Anvil errors ' + JSON.stringify(arf.errors));
      if (rrf.unsupported || !rrf.ok) whyRF.push('OpenCascade did not build every feature: ' + (rrf.unsupported || JSON.stringify(rrf.status)));
      if (!rrf.valid) whyRF.push('invalid solid');
      if (rfc.want != null) {
        if (!(Math.abs(rrf.volume - rfc.want) <= (rfc.tol || 1e-6) * rfc.want)) whyRF.push('OpenCascade volume ' + rrf.volume + ', exact ' + rfc.want);
        if (!(Math.abs(avrf - rfc.want) <= (rrf.tolerance || 0) * rfc.want)) whyRF.push('Anvil volume ' + avrf + ' against the exact ' + rfc.want + ' (tolerance ' + rrf.tolerance + ')');
      } else if (!(Math.abs(rrf.volume - avrf) <= 1e-4 * avrf)) whyRF.push('OpenCascade ' + rrf.volume + ' vs Anvil ' + avrf);
      if (rrf.faces.length !== rfc.faces) whyRF.push(rrf.faces.length + ' B-rep faces, want ' + rfc.faces);
      row(whyRF.length ? 'bad' : 'ok', rfName, whyRF.join('\n') || ('OpenCascade ' + rrf.volume.toFixed(7) + (rfc.want != null ? ' / exact ' + rfc.want.toFixed(7) : '') + ' / Anvil ' + avrf.toFixed(7) + ', ' + rrf.faces.length + ' faces'), performance.now() - trf);
      counts[whyRF.length ? 'fail' : 'pass']++;
    } catch (e) { row('bad', rfName, e.message); counts.fail++; }
  }
