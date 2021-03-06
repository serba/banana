define([
  'underscore',
  './interval'
],
function (_, Interval) {
  'use strict';

  var ts = {};

  function parseFloatValue(val) {
    return parseFloat(val);
  }

  // map compatable parseInt
//  function base10Int(val) {
//    return parseInt(val, 10);
//  }

  // trim the ms off of a time, but return it with empty ms.
  function getDatesTime(date) {
    return Math.floor(date.getTime() / 1000)*1000;
  }

  /**
   * Certain graphs require 0 entries to be specified for them to render
   * properly (like the line graph). So with this we will caluclate all of
   * the expected time measurements, and fill the missing ones in with 0
   * @param {object} opts  An object specifying some/all of the options
   *
   * OPTIONS:
   * @opt   {string}   interval    The interval notion describing the expected spacing between
   *                                each data point.
   * @opt   {date}     start_date  (optional) The start point for the time series, setting this and the
   *                                end_date will ensure that the series streches to resemble the entire
   *                                expected result
   * @opt   {date}     end_date    (optional) The end point for the time series, see start_date
   * @opt   {string}   fill_style  Either "minimal", or "all" describing the strategy used to zero-fill
   *                                the series.
   */
  ts.ZeroFilled = function (opts) {
    opts = _.defaults(opts, {
      interval: '10m',
      start_date: null,
      end_date: null,
      fill_style: 'minimal'
    });

    // the expected differenece between readings.
    this.interval = new Interval(opts.interval);
    //this.interval = 1

    // will keep all values here, keyed by their time
    this._data = {};
    this.start_value = opts.start_date && parseFloatValue(opts.start_date);
    this.end_value = opts.end_date && parseFloatValue(opts.end_date);
    this.opts = opts;
  };

  /**
   * Add a row
   * @param {int}  time  The time for the value, in
   * @param {any}  value The value at this time
   */
  ts.ZeroFilled.prototype.addValue = function (time, value) {
    if (time instanceof Date) {
      time = getDatesTime(time);
    } else {
      time = parseFloatValue(time);
    }
    if (!isNaN(time)) {
      this._data[time] = (_.isUndefined(value) ? 0 : value);
    }
    this._cached_times = null;
  };

  /**
   * Get an array of the times that have been explicitly set in the series
   * @param  {array} include (optional) list of timestamps to include in the response
   * @return {array} An array of integer times.
   */
  ts.ZeroFilled.prototype.getOrderedTimes = function (include) {
    var times = _.map(_.keys(this._data), parseFloatValue);
    if (_.isArray(include)) {
      times = times.concat(include);
    }
    return _.uniq(times.sort(function (a, b) {
      // decending numeric sort
      return a - b;
    }), true);
  };

  /**
   * return the rows in the format:
   * [ [time, value], [time, value], ... ]
   *
   * Heavy lifting is done by _get(Min|All)FlotPairs()
   * @param  {array} required_times  An array of timestamps that must be in the resulting pairs
   * @return {array}
   */
  ts.ZeroFilled.prototype.getFlotPairs = function (required_times) {
    var times = this.getOrderedTimes(required_times),
      strategy,
      pairs;

    if(this.opts.fill_style === 'all') {
      strategy = this._getAllFlotPairs;
    } else {
      strategy = this._getMinFlotPairs;
    }

    pairs = _.reduce(
      times,    // what
      strategy, // how
      [],       // where
      this      // context
    );

    // if the first or last pair is inside either the start or end time,
    // add those times to the series with null values so the graph will stretch to contain them.
    if (this.start_value && (pairs.length === 0 || pairs[0][0] > this.start_value)) {
      pairs.unshift([this.start_value, null]);
    }
    if (this.end_value && (pairs.length === 0 || pairs[pairs.length - 1][0] < this.end_value)) {
      pairs.push([this.end_value, null]);
    }

    return pairs;
  };

  /**
   * ** called as a reduce stragegy in getFlotPairs() **
   * Fill zero's on either side of the current time, unless there is already a measurement there or
   * we are looking at an edge.
   * @return {array} An array of points to plot with flot
   */
  ts.ZeroFilled.prototype._getMinFlotPairs = function (result, time, i, times) {
    var next, expected_next, prev, expected_prev;

    // check for previous measurement
    if (i > 0) {
      prev = times[i - 1];
      expected_prev = this.interval.before(time);
      if (prev < expected_prev) {
        result.push([expected_prev, 0]);
      }
    }

    // add the current time
    result.push([ time, this._data[time] || 0 ]);

    // check for next measurement
    if (times.length > i) {
      next = times[i + 1];
      expected_next = this.interval.after(time);
      if (next > expected_next) {
        result.push([expected_next, 0]);
      }
    }

    return result;
  };

  /**
   * ** called as a reduce stragegy in getFlotPairs() **
   * Fill zero's to the right of each time, until the next measurement is reached or we are at the
   * last measurement
   * @return {array}  An array of points to plot with flot
   */
  ts.ZeroFilled.prototype._getAllFlotPairs = function (result, time, i, times) {
    var next, expected_next;

    result.push([ times[i], this._data[times[i]] || 0 ]);
    next = times[i + 1];
    expected_next = this.interval.after(time);
    for(; times.length > i && next > expected_next; expected_next = this.interval.after(expected_next)) {
      result.push([expected_next, 0]);
    }

    return result;
  };


  return ts;
});
