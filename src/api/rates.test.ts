jest.mock('axios');

import axios from 'axios';
import { fetchRate } from './rates';

test('api get provider calls axios.get', () => {
  fetchRate();
  expect(axios.get).toBeCalledWith('costmodels/');
});
