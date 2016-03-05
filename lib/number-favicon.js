/*
 *  NumberFavicon class for generating and displaying a dynamic favicon
 * with a background and a number in the foreground.
 *
 * (c) Elias Kuiter 2016
 */

(function(global) {
  document.head = document.head || document.getElementsByTagName("head")[0];

  var number = 0, // current displayed number
    params = { width: 16, height: 16, colorDepth: 256, scale: 2 }, // default parameters
    digits = [
      ["OOO", "  O", "OOO", "OOO", "O O", "OOO", "OOO", "OOO", "OOO", "OOO"],
      ["O O", "  O", "  O", "  O", "O O", "O  ", "O  ", "  O", "O O", "O O"],
      ["O O", "  O", " O ", " O ", "OOO", "OOO", "OOO", "  O", "OOO", "OOO"],
      ["O O", "  O", "O  ", "  O", "  O", "  O", "O O", "  O", "O O", "  O"],
      ["OOO", "  O", "OOO", "OOO", "  O", "OOO", "OOO", "  O", "OOO", "OOO"]
    ], digitHeight = 5, digitWidth = 3;

  /*
   * Point class
   * x (number): x coordinate
   * y (number): y coordinate
   */
  function Point(x, y) {
    if (!(this instanceof Point))
      return new Point();
    this.x = x;
    this.y = y;
  }

  /*
   * Color class
   * r (number): red amount
   * g (number): green amount
   * b (number): blue amount
   * a (number): alpha value (0=transparent, 255=opaque)
   */
  function Color(r, g, b, a) {
    if (!(this instanceof Color))
      return new Color();
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  /*
   * Changes the favicon (see http://stackoverflow.com/questions/260857)
   * src (string): URL or data URI of the new favicon
   * type (string, optional): favicon MIME type (optional for .ico)
   */
  function changeFavicon(src, type) {
    var $$ = document.querySelector.bind(document);
    while ($$("link[rel=icon]"))
      $$("link[rel=icon]").remove();
    while ($$("link[rel='shortcut icon']"))
      $$("link[rel='shortcut icon']").remove();
    var link = document.createElement("link");
    link.rel = "shortcut icon";
    if (type)
      link.type = type;
    link.href = src;
    document.head.appendChild(link);
  }

  /*
   * Draws a colored pixel on a given PNG
   * png (PNGlib): PNG to draw on
   * point (Point): point coordinates (adjust if scale larger than 1!)
   * color (Color): pixel color
   * scale (number, optional): larger than 1 to scale up
   */
  function setPixel(png, point, color, scale) {
    scale = scale || 1;
    point.x *= scale, point.y *= scale;
    for (var i = 0; i < scale; i++)
      for (var j = 0; j < scale; j++)
        png.buffer[png.index(point.x + i, point.y + j)] = png.color(color.r, color.g, color.b, color.a);
  }

  /*
   * Draws a straight vertical or horizontal line on a given PNG
   * png (PNGlib): PNG to draw on
   * p1 (Point): first point coordinates (adjust if scale larger than 1!)
   * p2 (Point): second point coordinates
   * color (Color): line color
   * scale (number, optional): larger than 1 to scale up
   */
  function drawLine(png, p1, p2, color, scale) {
    if (p1.y === p2.y)
      for (var i = p1.x; i <= p2.x; i++)
        setPixel(png, new Point(i, p1.y), color, scale);
    if (p1.x === p2.x)
      for (var i = p1.y; i <= p2.y; i++)
        setPixel(png, new Point(p1.x, i), color, scale);
  }

  /*
   * Fills a PNG with raw image data
   * png (PNGlib): PNG to draw on
   * data (array): an array of pixel colors, one byte per pixel (0bRRRGGGBB)
   * alphaColor (number, optional): a color which should be transparent (0bRRRGGGBB)
   */
  function fillPNG(png, data, alphaColor) {
    // see https://www.arduino.cc/en/Reference/Map
    function map(x, in_min, in_max, out_min, out_max) {
      return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    for (var i = 0; i < data.length; i++) {
      var color = new Color( // see https://en.wikipedia.org/wiki/8-bit_color
        map((data[i] >> 5) & 0b111, 0, 7, 0, 255), // bit 5-7: red amount
        map((data[i] >> 2) & 0b111, 0, 7, 0, 255), // bit 2-4: green amount
        map( data[i]       &  0b11, 0, 3, 0, 255), // bit 0-1: blue amount
        data[i] === alphaColor ? 0 : 255
      );
      setPixel(png, new Point(i % params.width, Math.floor(i / params.width)), color);
    }
  }

  /*
   * Draws a digit on a given PNG
   * png (PNGlib): PNG to draw on
   * digit (number): digit to draw (0-9)
   * point (Point): top left digit coordinates
   * color (Color): digit foreground color
   * bgColor (Color): digit background color
   * scale (number, optional): larger than 1 to scale up
   */
  function drawDigit(png, digit, point, color, bgColor, scale) {
    scale = scale || 1;
    point.x /= scale, point.y /= scale;
    for (var y = 0; y < digitHeight; y++)
      for (var x = 0; x < digitWidth; x++)
        setPixel(png, new Point(point.x + x, point.y + y),
          digits[y][digit][x] === ' ' ? bgColor : color, scale);
  }

  /*
   * Creates a PNG with a specific background (data) and a number in the foreground
   * number (number): number to display (multiple digits allowed)
   */
  function makePNG(number) {
    // see http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
    var png = new PNGlib(params.width, params.height, params.colorDepth),
      background = png.color(0, 0, 0, 0),
      x = function(n) { return params.width  - n * digitWidth  * params.scale - 1; },
      y = function(n) { return params.height - n * digitHeight * params.scale - 1; };
    if (params.data)
      fillPNG(png, params.data, params.alphaColor);
    if (number != 0) {
      for (var i = 0; number != 0; i++) {
        drawDigit(png, number % 10, new Point(x(i + 1), y(1)), params.color, params.bgColor, params.scale);
        number = Math.floor(number / 10);
      }
      var topLeft   = new Point(x(i) - 1, y(1) - 1),
        topRight    = new Point(x(0)    , y(1) - 1),
        bottomLeft  = new Point(x(i) - 1, y(0)    ),
        bottomRight = new Point(x(0)    , y(0)    );
      drawLine(png, topLeft,    topRight,    params.bgColor); // top
      drawLine(png, topLeft,    bottomLeft,  params.bgColor); // left
      drawLine(png, bottomLeft, bottomRight, params.bgColor); // bottom
      drawLine(png, topRight,   bottomRight, params.bgColor); // right
    }
    return "data:image/png;base64," + png.getBase64();
  }

  /*
   * Checks whether the favicon needs to be updated and, if necessary, does that
   */
  function refresh(obtainNumber) {
    var newNumber = obtainNumber();
    if (newNumber != number) {
      number = newNumber;
      changeFavicon(makePNG(number), "image/png");
    }
  }

  /*
   * Returns a property setter
   */
  function setter(prop) {
    return function(val) {
      params[prop] = val;
    };
  }

  /*
   * NumberFavicon class
   * color (Color): digit foreground color
   * bgColor (Color): digit background color
   * alphaColor (Color): background alpha color
   * data (array): a background image (see fillPNG for binary format)
   */
  global.NumberFavicon = function(color, bgColor, alphaColor, data) {
    if (!(this instanceof NumberFavicon))
      return new NumberFavicon();
    var self = this,
      props = ["color", "alphaColor", "data", "width", "height", "colorDepth", "scale"];
    props.forEach(function(prop) {
      var capitalizedProp = prop.charAt(0).toUpperCase() + prop.slice(1);
      self["set" + capitalizedProp] = setter(prop);
    });
    this.setBackgroundColor = setter("bgColor");
    this.setColor(color);
    this.setBackgroundColor(bgColor);
    this.setAlphaColor(alphaColor);
    this.setData(data);
    this.refresh = refresh;
  };
  
  global.Color = Color;
})(window);