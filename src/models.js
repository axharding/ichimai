/* Catalog. Coordinates are view units; a square sheet is 240 across.
   D = half-diagonal of the square, used when the sheet sits as a diamond. */
const MODELS = (() => {
  const D = 120 * Math.SQRT2;
  const fold = (line, move, opts = {}) => ({ type: 'fold', line, move, dir: 'valley', ...opts });
  const mtn = (line, move, opts = {}) => fold(line, move, { ...opts, dir: 'mountain' });
  const crease = (line, move, opts = {}) => ({ type: 'crease', line, move, dir: 'valley', ...opts });
  const flip = { type: 'flip' };
  const rotate = (angle) => ({ type: 'rotate', angle });

  // bisector helpers for kite folds from a corner
  const t22 = Math.tan(Math.PI / 8);

  return [
    {
      id: 'dog-face', name: 'Dog Face', jp: 'いぬ', difficulty: 1, shape: 'square', category: 'animals',
      sides: 'one', colors: ['#b7793f', '#f7f4ec'], orient: 45, start: 'back',
      blurb: 'A floppy-eared puppy in five folds. A good first model for kids.',
      keywords: 'puppy dog animal kids',
      steps: [
        { text: 'Start with a square, colored side down. Turn it so a corner points up.' },
        { text: 'Fold the top corner down to meet the bottom corner.', ops: [fold([[-D, 0], [D, 0]], [0, -60], { tag: 'front', tagStay: 'back' })] },
        { text: 'Fold the left and right corners down at an angle to make the ears.', ops: [
          fold([[-60.7, 0], [-186, 86]], [-150, 5]),
          fold([[60.7, 0], [186, 86]], [150, 5]),
        ] },
        { text: 'Fold the top layer of the bottom point up to form the nose.', ops: [fold([[-60, 122], [60, 122]], [0, 160], { select: { tags: ['front'] } })] },
        { text: 'Fold the remaining point behind to square off the chin. Draw the eyes and nose.', ops: [mtn([[-60, 122], [60, 122]], [0, 160], { select: { tags: ['back'] } })],
          marks: [{ x: -34, y: 48, r: 6 }, { x: 34, y: 48, r: 6 }, { x: 0, y: 84, r: 8 }] },
      ],
    },
    {
      id: 'cat-face', name: 'Cat Face', jp: 'ねこ', difficulty: 1, shape: 'square', category: 'animals',
      sides: 'one', colors: ['#5f5a66', '#f7f4ec'], orient: 45, start: 'back',
      blurb: 'Pointed ears and a flat crown. Pairs well with the dog face.',
      keywords: 'kitten cat animal kids',
      steps: [
        { text: 'Start with a square, colored side down, a corner pointing up.' },
        { text: 'Fold the bottom corner up to meet the top corner.', ops: [fold([[-D, 0], [D, 0]], [0, 60])] },
        { text: 'Fold the left and right corners up so their points stand beside the top.', ops: [
          fold([[-8, 0], [-120, -75]], [-150, -6], { tag: 'ear' }),
          fold([[8, 0], [120, -75]], [150, -6], { tag: 'ear' }),
        ] },
        { text: 'Fold the top point behind, between the ears.', ops: [mtn([[-60, -96], [60, -96]], [0, -150], { select: { notTags: ['ear'] } })] },
        { text: 'Draw the face.', marks: [{ x: -30, y: -48, r: 6 }, { x: 30, y: -48, r: 6 }, { x: 0, y: -24, r: 5 }] },
      ],
    },
    {
      id: 'tulip', name: 'Tulip', jp: 'チューリップ', difficulty: 1, shape: 'square', category: 'nature',
      sides: 'one', colors: ['#c63b4c', '#f7f4ec'], orient: 45, start: 'back',
      blurb: 'A three-fold flower head. Make several for a spring card.',
      keywords: 'flower spring bloom card',
      steps: [
        { text: 'Start with a square, colored side down, a corner pointing up.' },
        { text: 'Fold the bottom corner up to the top corner.', ops: [fold([[-D, 0], [D, 0]], [0, 60])] },
        { text: 'Fold the left and right corners up so their points stick out past the sides.', ops: [
          fold([[-19.8, 0], [-132.5, -65]], [-160, -4]),
          fold([[19.8, 0], [132.5, -65]], [160, -4]),
        ] },
      ],
    },
    {
      id: 'cup', name: 'Drinking Cup', jp: 'コップ', difficulty: 1, shape: 'square', category: 'object',
      sides: 'two', colors: ['#3f8f9d', '#a9d3d6'], orient: 45, start: 'back',
      blurb: 'A cup that really holds water for a few minutes. Two-sided paper keeps the band at the top the same family of color.',
      keywords: 'cup water drink container classic',
      steps: [
        { text: 'Start with a square, a corner pointing up.' },
        { text: 'Fold the bottom corner up to the top corner.', ops: [fold([[-D, 0], [D, 0]], [0, 60], { tag: 'front', tagStay: 'back' })] },
        { text: 'Fold the right corner across so it touches the left edge. Its top edge should be level.', ops: [fold([[29.2, 0], [105.7, -184.8]], [150, -6])] },
        { text: 'Fold the left corner across to touch the right edge.', ops: [fold([[-29.2, 0], [-105.7, -184.8]], [-150, -6])] },
        { text: 'Fold the top flap down in front.', ops: [fold([[-80, -99.6], [80, -99.6]], [0, -150], { select: { tags: ['front'] } })] },
        { text: 'Fold the back flap down behind. Open the cup by pressing the sides.', ops: [mtn([[-80, -99.6], [80, -99.6]], [0, -150], { select: { tags: ['back'] } })] },
      ],
    },
    {
      id: 'whale', name: 'Whale', jp: 'くじら', difficulty: 1, shape: 'square', category: 'animals',
      sides: 'one', colors: ['#3e5b82', '#f7f4ec'], orient: 45, start: 'back',
      blurb: 'Starts from the kite base, the most useful first base to learn.',
      keywords: 'whale ocean sea animal kite base',
      steps: [
        { text: 'Start with a square, colored side down, a corner pointing up.' },
        { text: 'Fold in half from side to side and unfold to make a center crease.', ops: [crease([[0, -D], [0, D]], [-60, 0])] },
        { text: 'Fold the lower edges in to the center crease. This is the kite base.', ops: [
          fold([[0, D], [-99.41, -70.29]], [-150, 0]),
          fold([[0, D], [99.41, -70.29]], [150, 0]),
        ] },
        { text: 'Fold the top corner down along the line between the side corners.', ops: [fold([[-99.41, -70.29], [99.41, -70.29]], [0, -150])] },
        { text: 'Fold in half by folding the left half behind.', ops: [mtn([[0, -D], [0, D]], [-40, 0])] },
        { text: 'Rotate the model so the long point faces left.', ops: [rotate(90)] },
        { text: 'Fold the tail up. Draw an eye.', ops: [fold([[-112, 0], [-88, 70]], [-150, 3])], marks: [{ x: 50, y: 22, r: 5 }] },
      ],
    },
    {
      id: 'crane', name: 'Crane', jp: 'つる', difficulty: 3, shape: 'square', category: 'animals',
      sides: 'one', colors: ['#c4473a', '#f7f4ec'], orient: 45, start: 'front',
      blurb: 'The traditional orizuru. It passes through the preliminary base and the bird base, the two foundations of classic origami.',
      keywords: 'crane orizuru tsuru bird senbazuru traditional bird base preliminary base squash petal reverse fold',
      steps: (() => {
        const E = 49.71;                  // kite corners of the bird base sit at (±E, E)
        const L = [-400, -400, 0, 400], R = [0, -400, 400, 400];
        const squash = (flap, q, s, sgn) => [
          fold([[0, -10], [0, D + 10]], [60 * sgn, 40], { select: { tags: [flap], notTags: ['f'] } }),
          fold([[0, 0], [D * sgn, D]], [120 * sgn, 30], { select: { tags: [flap], notTags: ['b'] }, tag: q, tagStay: s }),
          fold([[0, 0], [-D * sgn, D]], [-120 * sgn, 30], { select: { tags: [flap], notTags: ['f'] }, tag: q, tagStay: s }),
        ];
        const petal = (q, s) => [
          fold([[0, D], [-E, E]], [-70, 90], { select: { tags: [q, s] }, within: L }),
          fold([[0, D], [E, E]], [70, 90], { select: { tags: [q, s] }, within: R }),
          fold([[-100, E], [100, E]], [0, 120], { select: { tags: [q] } }),
        ];
        const narrow = (s) => [
          fold([[0, D], [-33.76, 0]], [-40, 110], { select: { tags: [s] }, within: L }),
          fold([[0, D], [33.76, 0]], [40, 110], { select: { tags: [s] }, within: R }),
        ];
        const turn = { type: 'flip', axis: 0 };
        return [
          { text: 'Start with a square, colored side up, a corner pointing up.' },
          { text: 'Fold the top corner down to the bottom corner.', ops: [fold([[-D, 0], [D, 0]], [0, -60], { tag: 'f', tagStay: 'b' })] },
          { text: 'Fold the left corner over to the right corner.', ops: [fold([[0, -10], [0, D + 10]], [-60, 20], { tag: 'L', tagStay: 'R' })] },
          { text: 'Squash fold: lift the top flap upright, open its pocket, and press it flat into a square.', ops: squash('L', 'q1', 's1', 1) },
          { text: 'Turn the paper over.', ops: [turn] },
          { text: 'Squash the other flap the same way. This square, open end down, is the preliminary base.', ops: squash('R', 'q2', 's2', -1) },
          { text: 'Fold the lower edges of the top layer in to the center line, then unfold.', ops: [
            crease([[0, D], [-E, E]], [-70, 90], { select: { tags: ['q2'] }, within: L }),
            crease([[0, D], [E, E]], [70, 90], { select: { tags: ['q2'] }, within: R }),
          ] },
          { text: 'Fold the top triangle down along the line between those creases, then unfold.', ops: [crease([[-100, E], [100, E]], [0, 20], { select: { tags: ['q2'] } })] },
          { text: 'Petal fold: lift the bottom corner of the top layer up past the top. The sides fold in along the creases.', ops: petal('q2', 's2') },
          { text: 'Turn the paper over.', ops: [turn] },
          { text: 'Repeat the creases and petal fold on this side. This long diamond is the bird base.', ops: petal('q1', 's1') },
          { text: 'Fold the lower edges of the top layer in to the center line.', ops: narrow('s1') },
          { text: 'Turn the paper over.', ops: [turn] },
          { text: 'Fold the lower edges in to the center line on this side too.', ops: narrow('s2') },
          { text: 'Inside reverse fold the left point up between the layers to form the neck.', ops: [
            fold([[-90, 92.4], [30.6, 44.2]], [-5, 140], { select: { tags: ['s1', 's2'] }, within: L, place: 'keep', tag: 'neck' }),
          ] },
          { text: 'Inside reverse fold the right point up the same way to form the tail.', ops: [
            fold([[90, 92.4], [-30.6, 44.2]], [5, 140], { select: { tags: ['s1', 's2'] }, within: R, place: 'keep', tag: 'tail' }),
          ] },
          { text: 'Inside reverse fold the tip of the neck down to form the head.', ops: [
            fold([[-97.6, 10.2], [-22.4, -17]], [-78, -25], { select: { tags: ['neck'] }, place: 'keep', tag: 'head' }),
          ] },
          { text: 'Fold the front wing down along the line between the neck and tail.', ops: [fold([[-100, E], [100, E]], [0, 20], { select: { tags: ['q2'], notTags: ['neck', 'tail'] } })] },
          { text: 'Fold the back wing down behind to match.', ops: [mtn([[-100, E], [100, E]], [0, 20], { select: { tags: ['q1'], notTags: ['neck', 'tail'] } })] },
          { text: 'Hold the wings and pull them gently apart to shape the body. Your crane is finished.' },
        ];
      })(),
    },
    {
      id: 'penguin', name: 'Penguin', jp: 'ペンギン', difficulty: 2, shape: 'square', category: 'animals',
      sides: 'one', colors: ['#2c2c30', '#f7f4ec'], orient: 45, start: 'back',
      blurb: 'One-sided paper does the work here: the white side becomes the belly.',
      keywords: 'penguin bird winter animal color change',
      steps: [
        { text: 'Start with a square, white side up, a corner pointing up.' },
        { text: 'Fold in half from side to side and unfold.', ops: [crease([[0, -D], [0, D]], [-60, 0])] },
        { text: 'Fold the sides in from the top corner, leaving a white wedge open at the center for the belly.', ops: [
          fold([[0, -D], [-124.2, 45.5]], [-150, 0]),
          fold([[0, -D], [124.2, 45.5]], [150, 0]),
        ] },
        { text: 'Fold the bottom point behind so the penguin can stand.', ops: [mtn([[-60, 112], [60, 112]], [0, 150])] },
        { text: 'Fold the top point down to make the head.', ops: [fold([[-80, -92], [80, -92]], [0, -150], { tag: 'head' })] },
        { text: 'Fold the tip of the head back up to form the beak. Draw the eyes.', ops: [fold([[-40, -36], [40, -36]], [0, -20], { select: { tags: ['head'] } })],
          marks: [{ x: -16, y: -70, r: 4 }, { x: 16, y: -70, r: 4 }] },
      ],
    },
    {
      id: 'dart', name: 'Dart Plane', jp: 'かみひこうき', difficulty: 1, shape: 'a4', category: 'object',
      sides: 'one', colors: ['#5f8fbf', '#f7f4ec'], orient: 0, start: 'back',
      blurb: 'The classic schoolroom plane from a sheet of A4 or letter paper.',
      keywords: 'airplane paper plane flying glider a4 letter',
      steps: [
        { text: 'Start with an A4 sheet, colored side down, short edge at the top.' },
        { text: 'Fold in half lengthwise and unfold.', ops: [crease([[0, -120], [0, 120]], [-40, 0])] },
        { text: 'Fold the top corners in to the center crease.', ops: [
          fold([[0, -120], [-84.85, -35.15]], [-80, -115]),
          fold([[0, -120], [84.85, -35.15]], [80, -115]),
        ] },
        { text: 'Fold the new slanted edges in to the center crease again.', ops: [
          fold([[0, -120], [-84.85, 84.8]], [-80, 60]),
          fold([[0, -120], [84.85, 84.8]], [80, 60]),
        ] },
        { text: 'Fold in half by folding the left half behind.', ops: [mtn([[0, -120], [0, 120]], [-30, 40], { tag: 'left', tagStay: 'right' })] },
        { text: 'Rotate so the nose points left.', ops: [rotate(-90)] },
        { text: 'Fold the front wing down so its edge lines up with the bottom of the plane.', ops: [fold([[-130, -42.4], [130, -42.4]], [100, -70], { select: { tags: ['right'] } })] },
        { text: 'Fold the back wing down behind to match. Open the wings level and launch.', ops: [mtn([[-130, -42.4], [130, -42.4]], [100, -70], { select: { tags: ['left'] } })] },
      ],
    },
    {
      id: 'envelope', name: 'Letter Envelope', jp: 'ふうとう', difficulty: 1, shape: '3x5', category: 'object',
      sides: 'one', colors: ['#8c76ad', '#f7f4ec'], orient: 0, start: 'back',
      blurb: 'A pocket with a pointed flap, sized for a folded note or a gift card.',
      keywords: 'envelope letter note card pocket gift',
      steps: [
        { text: 'Start with a 3:5 sheet, colored side down, long edge at the bottom.' },
        { text: 'Fold the bottom edge up to make a pocket, a little past halfway.', ops: [fold([[-120, 21], [120, 21]], [0, 60], { tag: 'pocket' })] },
        { text: 'Fold the two top corners down at 45°, stopping just above the pocket.', ops: [
          fold([[-80, -72], [-120, -32]], [-115, -68]),
          fold([[80, -72], [120, -32]], [115, -68]),
        ] },
        { text: 'Fold the top flap down over the pocket to close the envelope.', ops: [fold([[-120, -40], [120, -40]], [0, -60])] },
      ],
    },
    {
      id: 'fortune-teller', name: 'Fortune Teller', jp: 'パクパク', difficulty: 2, shape: 'square', category: 'object',
      sides: 'one', colors: ['#dba22c', '#f7f4ec'], orient: 0, start: 'back',
      blurb: 'Also called a cootie catcher. Two rounds of the blintz fold, then shape with your fingers.',
      keywords: 'cootie catcher salt cellar game blintz kids',
      steps: [
        { text: 'Start with a square, colored side down.' },
        { text: 'Fold in half along one diagonal and unfold.', ops: [crease([[-120, -120], [120, 120]], [-60, 60])] },
        { text: 'Fold along the other diagonal and unfold.', ops: [crease([[120, -120], [-120, 120]], [60, 60])] },
        { text: 'Fold all four corners in to the center.', ops: [
          fold([[-120, 0], [0, -120]], [-110, -110]),
          fold([[0, -120], [120, 0]], [110, -110]),
          fold([[120, 0], [0, 120]], [110, 110]),
          fold([[0, 120], [-120, 0]], [-110, 110]),
        ] },
        { text: 'Turn the paper over.', ops: [flip] },
        { text: 'Fold the four new corners in to the center again.', ops: [
          fold([[-60, -60], [60, -60]], [0, -110]),
          fold([[60, -60], [60, 60]], [110, 0]),
          fold([[60, 60], [-60, 60]], [0, 110]),
          fold([[-60, 60], [-60, -60]], [-110, 0]),
        ] },
        { text: 'Fold in half top to bottom and unfold.', ops: [crease([[-60, 0], [60, 0]], [0, -40])] },
        { text: 'Fold in half side to side and unfold.', ops: [crease([[0, -60], [0, 60]], [-40, 0])] },
        { text: 'Turn over. Slide a thumb and finger into each of the four pockets and push the corners together.', ops: [flip] },
      ],
    },
    {
      id: 'kabuto', name: 'Samurai Helmet', jp: 'かぶと', difficulty: 2, shape: 'square', category: 'object',
      sides: 'one', colors: ['#9d3b3e', '#f7f4ec'], orient: 45, start: 'back',
      blurb: 'The kabuto folded for Children’s Day. Fold it from newspaper and it fits a child’s head.',
      keywords: 'kabuto samurai helmet hat childrens day japan',
      steps: [
        { text: 'Start with a square, colored side down, a corner pointing up.' },
        { text: 'Fold the top corner down to the bottom corner.', ops: [fold([[-D, 0], [D, 0]], [0, -60], { tag: 'front', tagStay: 'back' })] },
        { text: 'Fold the left and right corners down to the bottom point.', ops: [
          fold([[0, 0], [-100, 100]], [-150, 10], { tag: 'side' }),
          fold([[0, 0], [100, 100]], [150, 10], { tag: 'side' }),
        ] },
        { text: 'Fold both bottom points of these flaps up to the top point.', ops: [fold([[-90, D / 2], [90, D / 2]], [0, 150], { select: { tags: ['side'] }, tag: 'horn' })] },
        { text: 'Fold the two top points out and down to make the horns.', ops: [
          fold([[-48.75, 48.75], [-55.97, 84.85]], [-10, 60], { select: { tags: ['horn'] }, within: [-200, -200, 0, 200] }),
          fold([[48.75, 48.75], [55.97, 84.85]], [10, 60], { select: { tags: ['horn'] }, within: [0, -200, 200, 200] }),
        ] },
        { text: 'Fold the front layer of the bottom point up to the base of the horns.', ops: [fold([[-50, 127.3], [50, 127.3]], [0, 160], { select: { tags: ['front'] } })] },
        { text: 'Fold that layer up again along the base of the horns to form the brim.', ops: [fold([[-90, D / 2], [90, D / 2]], [0, 110], { select: { tags: ['front'] } })] },
        { text: 'Fold the back point up inside the helmet. Open the bottom to wear it.', ops: [mtn([[-90, D / 2], [90, D / 2]], [0, 140], { select: { tags: ['back'] } })] },
      ],
    },
    {
      id: 'heart', name: 'Simple Heart', jp: 'ハート', difficulty: 2, shape: 'square', category: 'object',
      sides: 'two', colors: ['#c94d68', '#f2bfc9'], orient: 45, start: 'front',
      blurb: 'Both faces of the paper show in the finished heart, so use paper colored on both sides.',
      keywords: 'heart love valentine card gift',
      steps: [
        { text: 'Start with a square, a corner pointing up. Both sides of this paper are colored.' },
        { text: 'Fold in half from side to side and unfold.', ops: [crease([[0, -D], [0, D]], [-60, 0])] },
        { text: 'Fold the top corner down to the center of the paper.', ops: [fold([[-D, -D / 2], [D, -D / 2]], [0, -150])] },
        { text: 'Fold the bottom corner up to the top edge.', ops: [fold([[-D, D / 4], [D, D / 4]], [0, 150])] },
        { text: 'Fold the bottom edges up along the center crease.', ops: [
          fold([[0, D / 4], [-120, D / 4 - 120]], [-120, 20]),
          fold([[0, D / 4], [120, D / 4 - 120]], [120, 20]),
        ] },
        { text: 'Turn the paper over.', ops: [flip] },
        { text: 'Fold the outer corners behind to round the sides of the heart.', ops: [
          mtn([[-88.4, -100], [-88.4, -30]], [-100, -63.6]),
          mtn([[88.4, -100], [88.4, -30]], [100, -63.6]),
        ] },
        { text: 'Fold the top points behind to round the top of each lobe.', ops: [mtn([[-120, -111.7], [120, -111.7]], [-42.4, -124])] },
      ],
    },
    {
      id: 'sonobe-cube', name: 'Sonobe Cube', jp: 'そのべユニット', difficulty: 3, shape: 'square', category: 'multi', sheets: 6,
      sides: 'one', colors: ['#4f8f68', '#f7f4ec'], orient: 0, start: 'back',
      blurb: 'Six identical units lock together into a cube with no glue. The same unit builds 12- and 30-piece kusudama.',
      keywords: 'sonobe modular unit cube kusudama assembly',
      steps: [
        { text: 'You need 6 squares, ideally 2 each of 3 colors. Start with one, colored side down.' },
        { text: 'Fold in half top to bottom and unfold.', ops: [crease([[-120, 0], [120, 0]], [0, -60])] },
        { text: 'Fold the top and bottom edges in to the center crease.', ops: [
          fold([[-120, -60], [120, -60]], [0, -100]),
          fold([[-120, 60], [120, 60]], [0, 100]),
        ] },
        { text: 'Fold the bottom-left corner up to the top edge and the top-right corner down to the bottom edge. Tuck each point under the cupboard flap. You now have a parallelogram.', ops: [
          fold([[-120, -60], [0, 60]], [-110, 50]),
          fold([[120, 60], [0, -60]], [110, -50]),
        ] },
        { text: 'Turn the unit over.', ops: [flip] },
        { text: 'Fold the left point up to the top edge and the right point down to the bottom edge to make a square, then unfold. These creases form the tabs.', ops: [
          crease([[0, -60], [60, 0]], [100, -55]),
          crease([[0, 60], [-60, 0]], [-100, 55]),
        ] },
        { text: 'Fold the other 5 units the same way. Slide each tab into a pocket of the neighboring unit until all six form a cube.', note: 'cube' },
      ],
    },
  ];
})();
if (typeof module !== 'undefined') module.exports = MODELS;
