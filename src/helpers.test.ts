import { getMe, getPodRoot } from './helpers'

describe("getMe", () => {
  it("throws an error if me isn't found", async () => {
    jest.mock('solid-logic', () => ({
      authn: {
        currentUser: jest.fn().mockReturnValueOnce(null)
      },
      store: {
        fetcher: {
          load: jest.fn().mockResolvedValue(null)
        }
      }
    }));
    
    await expect(getMe()).rejects.toThrow('Current user not found! Not logged in?')
    
  })
})

describe("getPodRoot", () => {
  it("throws an error if podRoot isn't found", async () => {
    jest.mock('solid-logic', () => ({
      store: {
        any: jest.fn(() => null)
      }
    }))
 
  await expect(getPodRoot("https://test")).rejects.toThrow()
})
})

afterEach(() => {
  jest.restoreAllMocks();
})
