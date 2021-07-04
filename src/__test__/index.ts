import { createReactiveVar } from '../index';
test('createStateSelector', () => {
  expect(
    createReactiveVar({
      name: 'modalsVar',
      initialState: { isOpen: false },
      reducers: {
        setModalShow: (s, payload) => ({ ...s, isOpen: payload }),
      },
    }),
  ).toBe({ fieldTypes: {}, nonHookSelectors: {}, reducers: {}, selectors: {}, reactiveVars: {} });
});

// const {fieldTypes, nonHookSelectors, reducers, selectors, reactiveVars} = createReactiveVar({
//     name: 'modalsVar',
//     initialState: { isOpen: false },
//     reducers: {
//       setModalShow: (s, payload) => ({ ...s, isOpen: payload }),
//     },
//   })
