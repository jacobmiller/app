import o from 'component-dom';
import debug from 'debug';

let log = debug('democracyos:body-serializer');
const DATA_ID_ATTR = 'data-section-id';

function divToObject (div, position) {
  let obj = {};
  let id = div.attr(DATA_ID_ATTR);
  if (id) {
    obj.id = id;
    div.removeAttr(DATA_ID_ATTR);
  }

  obj.markup = div[0].outerHTML;
  obj.position = position;
  return obj;
}

function paragraphToHTML (paragraph, options) {
  var el = o(paragraph.markup);
  el.attr(DATA_ID_ATTR, paragraph.id);
  if ('object' === typeof options && options.className) {
    options.className
      .filter(cl => !!cl)
      .forEach(cl => el.addClass(cl));
  }
  if ('function' === typeof options) {
    options(el);
  }

  return el[0].outerHTML;
}

/**
 * Transforms a List of HTML elements into a `Array` of `Object`
 * @param html The bare HTML elements, string or domified
 * @return `Array` of `Object`
 */

function deleteDuplicatedIDs (arr) {
  /**
   * Known issue: if you add a paragraph at the beginning, the second paragraph
   * will be interpreted as the new one. The side comments of the existing paragraph
   * will become the side comments of the first/new paragraph.
   */
  var clean = [];
  var lastId = arr[0].id;
  clean.push(arr[0]);
  for (var i = 1; i < arr.length; i++) {
    var current = arr[i];
    if (current.id === lastId) {
      current.id = null;
    } else {
      lastId = current.id;
    }
    clean.push(current);
  }

  return clean;
}

export function toArray (html) {
  var arr = [];
  o(html)
    .find('div, li')
    .each((div, i) => arr.push(divToObject(o(div), i)));

  /**
   * Inserting new paragraphs makes Quill to duplicate the id references. We have to
   * traverse all the serialized objects and remove the duplicate ids. The new paragraphs
   * will be submitted with no ids so the server will interpret that are the new ones
   * and assign them a new id.
   */
  arr = deleteDuplicatedIDs(arr);

  log('toArray:\nhtml: %s\narray: %j', html, arr);
  return arr;
}

/**
 * Transform an array of string into HTML code. Expects the strings in the array are valid HTML
 * @param paragraphs The actual array
 * @return A `String` representing HTML code
 */

export function toHTML (paragraphs, options) {
  if (paragraphs instanceof Array) {
    // Sort the paragraphs by position
    paragraphs = paragraphs.sort((a, b) => (a.position !== undefined && b.position !== undefined) ? a.position - b.position : 0);
    return paragraphs.map(paragraph => paragraphToHTML(paragraph, options)).join('');
  }
  else {
    return paragraphToHTML(paragraphs, options);
  }
}