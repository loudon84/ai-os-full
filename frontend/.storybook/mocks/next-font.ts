// Mock for next/font/google
// Returns empty className and style to avoid next/font errors in Storybook
const mockFont = () => ({
  className: "",
  style: {},
});

module.exports = mockFont;
