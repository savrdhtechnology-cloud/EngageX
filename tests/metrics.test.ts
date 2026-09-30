import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize, campaignAudience, normalizePhone, csvCell } from '../src/lib/metrics.ts';
import type { Message, Campaign, Contact } from '../src/types/index.ts';
const now = Date.parse('2026-09-30T12:00:00Z');
const msg = (data: Partial<Message>): Message => ({ id: 'm', contact_id: 'c', contact_name: 'Test', channel: 'email', direction: 'outbound', status: 'sent', body: 'hello', created_at: '2026-09-30T10:00:00Z', ...data });
test('empty data returns zero metrics instead of fabricated totals', () => {
  const stats = summarize([], [], null, 'all', now);
  assert.equal(stats.totalSent, 0); assert.equal(stats.deliveryRate, 0); assert.equal(stats.clicks, 0);
});
test('inbound, failed and pending messages are not counted as successful sends', () => {
  const stats = summarize([], [msg({status:'read'}), msg({direction:'inbound', status:'read'}), msg({status:'failed'}), msg({status:'pending'})], null, 'all', now);
  assert.equal(stats.totalSent, 1); assert.equal(stats.delivered, 1); assert.equal(stats.read, 1); assert.equal(stats.failed, 1); assert.equal(stats.replies, 1);
});
test('date and channel filters affect metrics', () => {
  const stats = summarize([], [msg({}), msg({channel:'sms'}), msg({created_at:'2026-08-01T00:00:00Z'})], 7, 'email', now);
  assert.equal(stats.totalSent, 1);
});
test('normalize Indian mobile variants consistently', () => {
  assert.equal(normalizePhone('98933 45906'), normalizePhone('+91 9893345906'));
  assert.equal(normalizePhone('919893345906'), '919893345906');
});
test('CSV quotes are escaped and formula execution is neutralized', () => {
  assert.equal(csvCell('A "quote", B'), '"A ""quote"", B"');
  assert.equal(csvCell('=1+1'), '"\'=1+1"');
});
test('campaign audience excludes unsubscribed, wrong tag, and missing consent', () => {
  const contact = { id:'c', name:'Test', mobile:'+919893345906', email:'a@example.com', tags:['lead'], status:'active', email_consent:true } as Contact;
  const campaign = { channels:['email'], target_audience:'Tags: #lead' } as Campaign;
  assert.equal(campaignAudience(campaign, [contact, {...contact,id:'b',status:'unsubscribed'}, {...contact,id:'d',tags:['other']}, {...contact,id:'e',email_consent:false}]).length, 1);
});
