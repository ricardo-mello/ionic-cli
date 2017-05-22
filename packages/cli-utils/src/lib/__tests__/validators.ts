import * as chalk from 'chalk';

import { load } from '../modules';
import { validators } from '../validators';

const stripAnsi = load('strip-ansi');

describe('@ionic/cli-utils', () => {

  describe('validators.email', () => {
    it('should return a generic message if the email is an empty string', () => {
      const result = validators.email('');
      expect(result).toEqual('Invalid email address.');
    });

    it('should return a name specific message if the email is empty and a name is provided', () => {
      const result = validators.email('', 'my_key');
      expect(stripAnsi(result)).toEqual('my_key is an invalid email address.');
    });

    it('should return a string if email address is invalid', () => {
      const r3 = validators.email('asdf');
      const r4 = validators.email('foo@foo');
      expect(stripAnsi(r3)).toEqual('Invalid email address.');
      expect(stripAnsi(r4)).toEqual('Invalid email address.');
    });

    it('should validate an email', () => {
      const result = validators.email('a@b.c');
      expect(result).toBe(true);
    });

  });

});
