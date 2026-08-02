/**
 * Minimal betable market_factory candid for gamerholic integration.
 * Aligned with betable `market_factory` + external outcomes / stop_bets.
 */

export const betableMarketFactoryIdl = ({ IDL }: { IDL: any }) => {
  const MarketStatus = IDL.Variant({
    pending: IDL.Null,
    active: IDL.Null,
    closed: IDL.Null,
    resolved: IDL.Null,
    canceled: IDL.Null,
  });

  const MarketType = IDL.Variant({
    binary: IDL.Null,
    multi_outcome: IDL.Null,
  });

  const MarketOutcome = IDL.Variant({
    yes: IDL.Null,
    no: IDL.Null,
    draw: IDL.Null,
  });

  const SignalSource = IDL.Record({
    url: IDL.Text,
    title: IDL.Text,
    source_type: IDL.Text,
  });

  const FeeSplitRecipient = IDL.Record({
    recipient: IDL.Principal,
    percentage: IDL.Nat,
    recipient_label: IDL.Text,
    username: IDL.Opt(IDL.Text),
  });

  const Market = IDL.Record({
    id: IDL.Text,
    principal_id: IDL.Principal,
    title: IDL.Text,
    description: IDL.Text,
    country: IDL.Text,
    category: IDL.Text,
    status: MarketStatus,
    creator: IDL.Principal,
    close_date: IDL.Int,
    yes_criteria: IDL.Text,
    no_criteria: IDL.Text,
    upvotes: IDL.Nat,
    downvotes: IDL.Nat,
    required_upvotes: IDL.Nat,
    creator_fee: IDL.Float64,
    cost_to_deploy: IDL.Nat,
    signal_sources: IDL.Vec(SignalSource),
    created_at: IDL.Int,
    resolved_at: IDL.Opt(IDL.Int),
    resolved_to: IDL.Opt(MarketOutcome),
    market_type: MarketType,
    outcomes: IDL.Vec(IDL.Text),
    resolved_to_index: IDL.Opt(IDL.Nat),
    split_with_winner: IDL.Bool,
    split_percentage: IDL.Opt(IDL.Nat),
    split_others: IDL.Vec(FeeSplitRecipient),
    live_stream_url: IDL.Text,
    external_outcomes: IDL.Bool,
    fixed_split_recipient: IDL.Opt(IDL.Principal),
    fixed_split_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  return IDL.Service({
    create_market: IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Int,
        IDL.Text,
        IDL.Text,
        IDL.Float64,
        IDL.Vec(SignalSource),
        IDL.Opt(IDL.Nat),
        MarketType,
        IDL.Vec(IDL.Text),
        IDL.Bool,
        IDL.Opt(IDL.Nat),
        IDL.Text,
        IDL.Vec(FeeSplitRecipient),
        IDL.Bool,
        IDL.Opt(IDL.Principal),
        IDL.Opt(IDL.Vec(IDL.Nat8)),
      ],
      [IDL.Text],
      [],
    ),
    get_market: IDL.Func([IDL.Text], [IDL.Opt(Market)], ["query"]),
    stop_bets: IDL.Func([IDL.Text], [IDL.Bool], []),
    close_market: IDL.Func([IDL.Text], [IDL.Bool], []),
    list_active_markets: IDL.Func([], [IDL.Vec(Market)], ["query"]),
  });
};
