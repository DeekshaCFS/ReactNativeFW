import {configureTouchlessApi} from '../api/Api';
import {TOUCHLESS_ENDPOINTS, URLConstant} from '../api/URLConstant';

// Replace Base constants with your real backend values.
configureTouchlessApi({
  baseUrl: URLConstant.Base.BASEURL,
  endpoints: TOUCHLESS_ENDPOINTS,
});
