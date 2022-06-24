const acorn = require('acorn-loose');
const { generate } = require('astring');

// Pipeline operations:
// 1. Modify the pipeline (add/update/remove stages)
// 2. Run the pipeline
// 3. Export the pipeline results
// 4. Export the pipeline as code
// 5. Save/open a pipeline
// 6. Run a pipeline upto a stage

//   stagesToPipeline(stages: Stage[]): string;
//   pipelineToStages(pipeline: string): Stage[];

const parser = (input) => {
  const program = parseInput(input);
  const stages = convertToStages(program, input);

  if (!stages) {
    throw new Error(
      'Unable to extract pipeline stages: the provided input is not an array of objects.'
    );
  }

  return stages;
};

function parseInput(input) {
  try {
    const program = acorn.parse(input, {
      ecmaVersion: 6,
      ranges: true,
      locations: true,
    });

    return program;
  } catch (originalError) {
    const err = new Error(
      `Unable to parse the pipeline source: ${originalError.message}`
    );
    err.stack = originalError.stack;
    throw err;
  }
}

function convertToStages(program, input) {
  if (!program.body || program.body.length !== 1) {
    return;
  }

  const node = program.body[0];

  if (node.type !== 'ExpressionStatement') {
    return;
  }

  const { type, elements } = node.expression || {};

  if (type !== 'ArrayExpression') {
    return;
  }

  if (elements.find((element) => !isValidObjectExpression(element))) {
    return;
  }

  return elements.map((element) => objectExpressionToStage(element, input));
}

function isValidObjectExpression(element) {
  return element.type === 'ObjectExpression' && element.properties;
}

function objectExpressionToStage(objectExpression, input) {
  if (objectExpression.properties.length === 0) {
    const [start, end] = objectExpression.range;
    const stage = input.substring(start, end);
    const { operator, source } = parseCommentedStage(stage);
    return {
      operator,
      source,
      isEnabled: false,
    };
  }

  const { key: keyNode, value: valueNode } = objectExpression.properties[0];
  return {
    operator: keyNode.name || keyNode.value,
    source: astToString(valueNode),
    isEnabled: true,
  };
}

function parseCommentedStage(stage) {
  const doubleSlashCommentsRegex = /^( )*(\/\/)./gm;
  const blockCommentsRegex = /(\/(\*)+)|(^( )*\*[^\/])|((\*)(\/))$/gm;
  const operatorRegex = /^\$[a-z]*[\ \n]*\:/gi;

  // Remove leading { and trailing }
  // Remove // comments
  // Remove /** */ comments
  const code = stage
    .replace(/^{+/, '')
    .replace(/}+$/, '')
    .replace(doubleSlashCommentsRegex, '')
    .replace(blockCommentsRegex, '')
    .trim();

  const operator = code.match(operatorRegex);
  const input = code.replace(operator, '').replace(/\,$/, '').trim();

  const ast = parseInput(`[${input}]`);
  const source = astToString(ast.body[0])
    .replace(/^\[/, '')
    .replace(/\];$/, '');

  return {
    operator: operator ? operator[0].replace(':', '').trim() : '',
    source,
  };
}

function astToString(ast) {
  return generate(ast, { comments: true, indent: '  ' });
}

module.exports = { parser };
