test('Input checked', () => {
  const app = <input type="checkbox" checked={true} />
  expect(app.props.checked).toBe(true)
})
