create or replace function public.set_client_payment_status(
  p_client_id text,
  p_status public."ClientPaymentStatus",
  p_amount double precision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_subscription_id text;
begin
  if not exists (select 1 from public."Client" where "id" = p_client_id) then
    raise exception 'Client not found.' using errcode = 'P0002';
  end if;

  update public."Client"
  set "isPaid" = p_status = 'PAID', "paymentStatus" = p_status
  where "id" = p_client_id;

  if p_status = 'PAID' then
    if p_amount is null or p_amount <= 0 then
      raise exception 'A positive payment amount is required.' using errcode = '22023';
    end if;

    select "id" into latest_subscription_id
    from public."ClientSubscription"
    where "clientId" = p_client_id
    order by "startsAt" desc
    limit 1;

    insert into public."Payment" (
      "amount", "currency", "note", "clientId", "clientSubscriptionId"
    ) values (
      p_amount, 'EGP', 'Marked paid from the admin dashboard.',
      p_client_id, latest_subscription_id
    );
  end if;
end;
$$;

revoke all on function public.set_client_payment_status(text, public."ClientPaymentStatus", double precision)
  from public, anon, authenticated;
grant execute on function public.set_client_payment_status(text, public."ClientPaymentStatus", double precision)
  to service_role;
