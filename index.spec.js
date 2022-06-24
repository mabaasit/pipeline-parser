const { expect } = require('chai');
const { parser } = require('./parser');

describe('should parse a pipeline', function () {
  it('when string', function () {
    const input = `[{$match: {i: 'long'}}, {$sort: {age: -1}}]`;
    const output = [
      {
        operator: '$match',
        source: "{\n  i: 'long'\n}",
        isEnabled: true,
      },
      {
        operator: '$sort',
        source: '{\n  age: -1\n}',
        isEnabled: true,
      },
    ];

    expect(parser(input)).deep.equal(output);
  });

  describe('single line comments', function () {
    it('with one disabled stage, double slash comment', function () {
      const input = `
        [
          {$match: {i: 'long'}},
          {
            // $sort: {age: -1},
          },
        ]
      `;
      const output = [
        {
          operator: '$match',
          source: "{\n  i: 'long'\n}",
          isEnabled: true,
        },
        {
          operator: '$sort',
          source: '{\n  age: -1\n}',
          isEnabled: false,
        },
      ];
      expect(parser(input)).deep.equal(output);
    });

    it('with one disabled stage, block comment', function () {
      const input = `
        [
          {$match: {i: 'long'}},
          {
            /** $sort: {age: -1}, */
          },
        ]
      `;
      const output = [
        {
          operator: '$match',
          source: "{\n  i: 'long'\n}",
          isEnabled: true,
        },
        {
          operator: '$sort',
          source: '{\n  age: -1\n}',
          isEnabled: false,
        },
      ];
      expect(parser(input)).deep.equal(output);
    });

    it('with two disabled stages, double slash and block comment', function () {
      const input = `
        [
          {$match: {i: 'long'}},
          {
            /** $sort: {age: -1}, */
          },
          {
            // $limit: 20
          }
        ]
      `;
      const output = [
        {
          operator: '$match',
          source: "{\n  i: 'long'\n}",
          isEnabled: true,
        },
        {
          operator: '$sort',
          source: '{\n  age: -1\n}',
          isEnabled: false,
        },
        {
          operator: '$limit',
          source: '20',
          isEnabled: false,
        },
      ];
      expect(parser(input)).deep.equal(output);
    });
  });

  describe('multi line comments', function () {
    it('with one disabled stage, double slash comment', function () {
      const input = `
        [
          {$match: {i: 'long'}},
          {
            // $sort: {
            //   age: -1
            // },
          },
        ]
      `;
      const output = [
        {
          operator: '$match',
          source: "{\n  i: 'long'\n}",
          isEnabled: true,
        },
        {
          operator: '$sort',
          source: '{\n  age: -1\n}',
          isEnabled: false,
        },
      ];
      expect(parser(input)).deep.equal(output);
    });

    it('with one disabled stage, block comment', function () {
      const input = `
        [
          {$match: {i: 'long'}},
          {
            /**
             * $sort: {
             *  age: -1
             * } 
             */
          },
        ]
      `;
      const output = [
        {
          operator: '$match',
          source: "{\n  i: 'long'\n}",
          isEnabled: true,
        },
        {
          operator: '$sort',
          source: '{\n  age: -1\n}',
          isEnabled: false,
        },
      ];
      expect(parser(input)).deep.equal(output);
    });

    it('with two disabled stages, double slash and block comment', function () {
      const input = `
        [
          {$match: {i: 'long'}},
          {
            /**
             * $sort: {
             *  age: -1
             * } 
             */
          },
          {
            // $project: {
            //   _id: -1,
            //   name: 1,
            //   total: {$sum: "ratings"},
            // }
          }
        ]
      `;
      const output = [
        {
          operator: '$match',
          source: "{\n  i: 'long'\n}",
          isEnabled: true,
        },
        {
          operator: '$sort',
          source: '{\n  age: -1\n}',
          isEnabled: false,
        },
        {
          operator: '$project',
          source:
            '{\n  _id: -1,\n  name: 1,\n  total: {\n    $sum: "ratings"\n  }\n}',
          isEnabled: false,
        },
      ];
      expect(parser(input)).deep.equal(output);
    });
  });

  describe('valid comments, but not properly formatted', function () {
    it('case 1', function () {
      const input = `
        [
          {$match: {i: 'long'}},
          {/**
             * $sort: {
             *  age: -1
             * } 
             */},
          {// $project: {
            //   _id: -1,
            //   name: 1,
            //   total: {$sum: "ratings"},
            // }
          }
        ]
      `;
      const output = [
        {
          operator: '$match',
          source: "{\n  i: 'long'\n}",
          isEnabled: true,
        },
        {
          operator: '$sort',
          source: '{\n  age: -1\n}',
          isEnabled: false,
        },
        {
          operator: '$project',
          source:
            '{\n  _id: -1,\n  name: 1,\n  total: {\n    $sum: "ratings"\n  }\n}',
          isEnabled: false,
        },
      ];
      expect(parser(input)).deep.equal(output);
    });
    it('case 2', function () {
      const input = `
        [
          {$match: {i: 'long'}},
          {/**
             $sort: {
             age: -1
             } */},
          {// $project: {
            //   _id: -1,name: 1,
            //   total: {$sum: "ratings"}}
          }
        ]
      `;
      const output = [
        {
          operator: '$match',
          source: "{\n  i: 'long'\n}",
          isEnabled: true,
        },
        {
          operator: '$sort',
          source: '{\n  age: -1\n}',
          isEnabled: false,
        },
        {
          operator: '$project',
          source:
            '{\n  _id: -1,\n  name: 1,\n  total: {\n    $sum: "ratings"\n  }\n}',
          isEnabled: false,
        },
      ];
      expect(parser(input)).deep.equal(output);
    });
  });
});
