/**
 * Runs before any test module is imported.
 *
 * Axios picks its adapter when instances are created (at import time). React Native's Jest
 * environment provides a mocked XMLHttpRequest that never hits the network, so requests
 * would silently hang. Forcing Node's `http` adapter makes requests real Node requests,
 * which MSW intercepts.
 */
import axios from 'axios';

axios.defaults.adapter = 'http';
