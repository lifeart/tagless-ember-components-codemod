const { indentLines } = require('../utils');

const templateRecast = require('ember-template-recast');

const b = templateRecast.builders;

const PLACEHOLDER = '@@@PLACEHOLDER@@@';

module.exports = function transformTemplate(
  template,
  { tagName, elementId, classNames, classNameBindings, attributeBindings, ariaRole },
  options
) {
  // wrap existing template with root element
  let classNodes = [];
  if (options.hasComponentCSS) {
    classNodes.push(b.mustache('styleNamespace'));
  }
  for (let className of classNames) {
    classNodes.push(b.text(className));
  }
  classNameBindings.forEach(([truthy, falsy], property) => {
    if (!truthy) {
      classNodes.push(b.mustache(`unless this.${property} "${falsy}"`));
    } else {
      classNodes.push(b.mustache(`if this.${property} "${truthy}"${falsy ? ` "${falsy}"` : ''}`));
    }
  });

  let attrs = [];
  if (elementId) {
    attrs.push(b.attr('id', b.text(elementId)));
  }
  if (ariaRole) {
    attrs.push(b.attr('role', b.text(ariaRole)));
  }
  attributeBindings.forEach((value, key) => {
    attrs.push(b.attr(key, b.mustache(`this.${value}`)));
  });
  if (classNodes.length === 1) {
    attrs.push(b.attr('class', classNodes[0]));
  } else if (classNodes.length !== 0) {
    let parts = [];
    classNodes.forEach((node, i) => {
      if (i !== 0) parts.push(b.text(' '));
      parts.push(node);
    });

    attrs.push(b.attr('class', b.concat(parts)));
  }
  attrs.push(b.attr('...attributes', b.text('')));

  let templateAST = templateRecast.parse(template);

  templateAST.body = [
    b.element(tagName, {
      attrs,
      children: [b.text(`\n${PLACEHOLDER}\n`)],
    }),
  ];

  return templateRecast.print(templateAST).replace(PLACEHOLDER, indentLines(template));
};
