"use strict";

var _ = require('lodash');
var Money = require('money-core');

var test = function(format, currency) {
  return format.format(1000.2, {
    currency: currency,
    precision: 1
  });
};

var browserLocale = require('browser-locale')();

var NumberFormat = function(locale) {
  var self = this;

  //Constructor!
  self._locale = locale || browserLocale;
};

NumberFormat.prototype._simplifyHelper = function(n, roundVal, divide, letter, options) {
  var self = this;
  var moneyCurrency;
  var num = Money.constructMoneyIfMatching(n);
  if (Money.isMoney(num)) {
    moneyCurrency = num.getCurrency();
    num = num.getAmount();
  }

  num = self.roundTo(num, roundVal);
  num /= divide;
  if (Math.abs(num) > 100) { //more than three digits
    num = Math.sround10(num);
  }
  if (moneyCurrency) {
    num = new Money(num, moneyCurrency);
  }
  num = self.format(num, {
    precision: 1,
    flattenDecimal: true,
    currency: options.currency
  });
  num += letter;
  return num;
};

NumberFormat.prototype._simple = function(n, options) {
  var self = this;
  var num = Money.constructMoneyIfMatching(n);
  var nVal = Money.isMoney(num) ? num.getAmount() : num;
  var str;
  if (Math.abs(nVal) >= 1000000000) {
    str = self._simplifyHelper(num, 100000000, 1000000000, "B", options);
  } else if (Math.abs(nVal) >= 1000000) {
    str = self._simplifyHelper(num, 100000, 1000000, "M", options);
  } else if (Math.abs(nVal) >= 1000) {
    str = self._simplifyHelper(num, 100, 1000, "K", options);
  } else {
    str = self.format(num, {
      precision: 0,
      currency: options.currency
    });
  }
  return str;
};

NumberFormat.prototype.roundTo = function(value, roundVal) {
  if (roundVal) {
    return Math.sround10(value / roundVal) * roundVal;
  }
  return value;
};

NumberFormat.prototype.cleanNumber = function(s) {
  var self = this;
  if (s && _.isString(s)) {
    //Number looks like the strictest of the number converters
    if (!self._parseRegexp) {
      self._parseRegexp = new RegExp('[^-0-9KkMm\\' + self.getDecimalSeparator() + ']', 'g');
      self._parseRegexp2 = new RegExp('\\' + self.getDecimalSeparator(), 'g');
      self._parseRegexp3 = new RegExp('[KkMm]', 'g');
    }
    //This really should be just one call to regex
    var str = s.replace(self._parseRegexp, '').replace(self._parseRegexp2, '.');
    var matches = str.match(self._parseRegexp3);
    var num = Number(str.replace(self._parseRegexp3, ''));
    return _.reduce(matches, function(memo, char) {
      // TODO: Add support for unicorns obvi
      if (char === 'K' || char === 'k') {
        return memo * 1000;
      } else if (char === 'M' || char === 'm') {
        return memo * 1000000;
      }
    }, num);
  } else if (s && _.isNumber(s)) {
    return s;
  }
  return NaN;
};

//options are:
//  simple - if true, use simple number logic (for dashboards and the like)
//  precision - number of decimal places, default 0
//  flattenDecimal - if true, flatten .0+ to ''
//  prefix - use this as prefix if not currency
//  postfix - use this as postfix if not currency
//  currency - works list this:
//    if options.currency is false, it will always be formatted as a number
//    if value is Money object, it will be formatted as money if options.currency is true
//    if value is a Number, it will be formatted as a currency if is options.currency is a string(ISO currency)
NumberFormat.prototype.format = function(number, options) {
  var self = this;
  var str, currency;
  var opts = options || {};

  var num = Money.constructMoneyIfMatching(number);
  if (Money.isMoney(num)) {
    currency = opts.currency ? num.getCurrency() : false;
    num = num.getAmount();
  } else if (_.isString(opts.currency)) {
    currency = opts.currency;
  }
  var precision = opts.precision || 0;
  var prefix = opts.prefix || '';
  var postfix = opts.postfix || '';
  if (num || num === 0) {
    var toLocaleOptions = {
      maximumFractionDigits: precision,
      minimumFractionDigits: opts.flattenDecimal ? 0 : precision
    };
    if (currency) {
      toLocaleOptions.currency = currency;
      toLocaleOptions.style = 'currency';
    }
    return prefix + num.toLocaleString(self._locale, toLocaleOptions) + postfix;
    // var base = 'n';
    // if (toLocaleOptions.style === 'currency') {
    //   base = 'c';
    // }
  }
  return str;
};


//currency is only used if number isn't a money object
NumberFormat.prototype.formatMoney = function(number, currency) {
  var self = this;
  return self.format(number, {
    currency: _.isUndefined(currency) ? true : currency,
    flattenDecimal: true,
    precision: 2
  });
};

//currency is only used if number isn't a money object
NumberFormat.prototype.formatIntegerMoney = function(number, currency) {
  var self = this;
  return self.format(number, {
    currency: _.isUndefined(currency) ? true : currency,
    precision: 0
  });
};

NumberFormat.prototype.formatNumber = function(number, precision) {
  var self = this;
  return self.format(number, {
    currency: false,
    precision: _.isNumber(precision) ? precision : 2,
    flattenDecimal: true
  });
};

NumberFormat.prototype.formatInteger = function(number) {
  var self = this;
  return self.format(number, {
    currency: false,
    precision: 0
  });
};

NumberFormat.prototype.formatPercent = function(number, precision) {
  var self = this;
  return self.format(number, {
    currency: false,
    postfix: '%',
    precision: _.isNumber(precision) ? precision : 2,
    flattenDecimal: true
  });
};

NumberFormat.prototype.formatIntegerPercent = function(number) {
  var self = this;
  return self.format(number, {
    currency: false,
    postfix: '%',
    precision: 0
  });
};

NumberFormat.prototype.formatSimpleMoney = function(number, currency) {
  var self = this;
  return self._simple(number, {
    currency: _.isUndefined(currency) ? true : currency,
  });
};

NumberFormat.prototype.formatSimpleNumber = function(number) {
  var self = this;
  return self._simple(number, {
    currency: false,
  });
};

function test(format, currency) {
  return format.format(1000.2, {
    currency: currency,
    precision: 1
  });
}
NumberFormat.prototype.getCurrencyPrefix = function(currency) {
  var self = this;
  //no real well to get this info from what I can tell, so trying to observe it.
  var output = test(self, currency);
  var firstNum = output.indexOf(1);
  return firstNum > 0 ? output.slice(0, firstNum) : '';
};
NumberFormat.prototype.getCurrencyPostfix = function(currency) {
  var self = this;
  //no real well to get this info from what I can tell, so trying to observe it.
  var output = test(self, currency);
  var lastNum = output.indexOf(2);
  return lastNum < output.length - 1 ? output.slice(lastNum + 1) : '';
};
NumberFormat.prototype.getDecimalSeparator = function() {
  return this._decimalSeparator || (this._decimalSeparator = test(this)[5]);
};

NumberFormat.prototype.getThousandSeparator = function() {
  return this._thousandSeparator || (this._thousandSeparator = test(this)[1]);
};

NumberFormat.prototype.getLocale = function() {
  var self = this;
  return self._locale;
};

if (typeof module === 'object') {
  module.exports = NumberFormat;
}

