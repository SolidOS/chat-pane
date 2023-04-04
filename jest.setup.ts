import "@testing-library/jest-dom";
import fetchMock from "jest-fetch-mock";
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder

fetchMock.enableMocks();
