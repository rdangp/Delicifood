import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyAccess,sanitizedHeaders} from '../hosting/access.mjs';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'test-key',alg:'RS256'};
const env={CF_ACCESS_TEAM_DOMAIN:'https://delicifood-test.cloudflareaccess.com',CF_ACCESS_AUD:'expected-audience'};
const base={iss:env.CF_ACCESS_TEAM_DOMAIN,aud:['expected-audience'],sub:'user-1',email:'owner@example.com',exp:Math.floor(Date.now()/1000)+600};
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
async function token(claims=base){const data=encode({alg:'RS256',kid:'test-key'})+'.'+encode(claims);const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(data));return data+'.'+Buffer.from(signature).toString('base64url');}
const realFetch=globalThis.fetch;
globalThis.fetch=async url=>{assert.equal(url,env.CF_ACCESS_TEAM_DOMAIN+'/cdn-cgi/access/certs');return Response.json({keys:[jwk]});};
test('valid signed identity accepted',async()=>assert.equal((await verifyAccess(await token(),env)).email,'owner@example.com'));
test('wrong audience rejected',async()=>assert.rejects(verifyAccess(await token({...base,aud:['other']}),env)));
test('expired token rejected',async()=>assert.rejects(verifyAccess(await token({...base,exp:1}),env)));
test('wrong issuer rejected',async()=>assert.rejects(verifyAccess(await token({...base,iss:'https://attacker.example'}),env)));
test('forged signature rejected',async()=>{const good=await token();const parts=good.split('.');parts[1]=encode({...base,email:'attacker@example.com'});await assert.rejects(verifyAccess(parts.join('.'),env));});
test('no token or config rejected',async()=>{await assert.rejects(verifyAccess('',env));await assert.rejects(verifyAccess(await token(),{}));});
test('visitor supplied identity removed',()=>{const h=sanitizedHeaders({'OAI-Authenticated-User-Email':'owner@example.com','OAI-Authenticated-User-Id':'spoof','X-Middleware-Request-OAI-Authenticated-User-Email':'owner@example.com','Content-Type':'application/json'});assert.equal(h.get('oai-authenticated-user-email'),null);assert.equal(h.get('oai-authenticated-user-id'),null);assert.equal(h.get('x-middleware-request-oai-authenticated-user-email'),null);assert.equal(h.get('content-type'),'application/json');});
test.after(()=>{globalThis.fetch=realFetch;});
