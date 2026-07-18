-- The original fixture payments existed before payment method capture was added.
-- Complete only demo records, preserving all customer payment history untouched.
update public."Payment"
set "method" = case "id"
  when 'payomar0001' then 'INSTA_PAY'
  when 'paysara0001' then 'VISA'
  when 'paynada0001' then 'CASH'
  when 'payziad0001' then 'INSTA_PAY'
  else 'INSTA_PAY'
end
where "clientId" like 'demo-client-%'
  and "method" is null;
