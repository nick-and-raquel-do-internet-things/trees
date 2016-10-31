import urlEncode from 'urlencode';
import xs from 'xstream';

export default function locationDriver (sinks$) {
  sinks$.addListener({
    next: (location) => history.pushState(null, null, `#${location}`)
  });

  if (!location.hash) {
    return xs.empty();
  }

  return xs.of(JSON.parse(urlEncode.decode(location.hash.slice(1))));
}
