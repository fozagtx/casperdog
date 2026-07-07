#![no_std]
extern crate alloc;

use alloc::string::String;
use casper_contract::contract_api::{runtime, storage};
use casper_contract::unwrap_or_revert::UnwrapOrRevert;
use casper_types::{
    account::AccountHash, ApiError, CLValue, Key, URef, U256,
};

fn revert(code: u16) -> ! { runtime::revert(ApiError::User(code)); }

const ADMIN_KEY: &str = "admin";
const OPERATORS_DICT: &str = "operators";
const POSITIONS_DICT: &str = "positions";

fn get_admin() -> AccountHash {
    storage::read(runtime::get_key(ADMIN_KEY).unwrap_or_revert().into_uref().unwrap_or_revert())
        .unwrap_or_revert().unwrap_or_revert()
}

fn only_admin() {
    if runtime::get_caller() != get_admin() { revert(1); }
}

#[no_mangle]
fn init() {
    if runtime::get_key(ADMIN_KEY).is_some() { revert(6); }
    let admin: AccountHash = runtime::get_named_arg("admin");
    runtime::put_key(ADMIN_KEY, Key::URef(storage::new_uref(admin)));
    let od = storage::new_dictionary(OPERATORS_DICT).unwrap_or_revert_with(ApiError::User(99));
    runtime::put_key(OPERATORS_DICT, Key::URef(od));
    let pd = storage::new_dictionary(POSITIONS_DICT).unwrap_or_revert_with(ApiError::User(99));
    runtime::put_key(POSITIONS_DICT, Key::URef(pd));
}

#[no_mangle]
fn add_operator() {
    only_admin();
    let op: AccountHash = runtime::get_named_arg("operator");
    let d = runtime::get_key(OPERATORS_DICT).unwrap_or_revert().into_uref().unwrap_or_revert();
    storage::dictionary_put(d, &alloc::format!("{:?}", op), true);
}

#[no_mangle]
fn register_position() {
    let user: AccountHash = runtime::get_named_arg("user");
    let pool: String = runtime::get_named_arg("pool");
    let threshold: U256 = runtime::get_named_arg("threshold");
    let d = runtime::get_key(POSITIONS_DICT).unwrap_or_revert().into_uref().unwrap_or_revert();
    storage::dictionary_put(d, &alloc::format!("{:?}", user), (pool, threshold));
}

#[no_mangle]
fn rebalance() {
    let caller = runtime::get_caller();
    let d = runtime::get_key(OPERATORS_DICT).unwrap_or_revert().into_uref().unwrap_or_revert();
    let authorized = storage::dictionary_get::<bool>(d, &alloc::format!("{:?}", caller))
        .unwrap_or_revert().unwrap_or(false);
    if !authorized && caller != get_admin() { revert(2); }
    let user: AccountHash = runtime::get_named_arg("user");
    let pd = runtime::get_key(POSITIONS_DICT).unwrap_or_revert().into_uref().unwrap_or_revert();
    let pos: Option<(String, U256)> = storage::dictionary_get(pd, &alloc::format!("{:?}", user))
        .unwrap_or_revert();
    if pos.is_none() { revert(4); }
    runtime::put_key("last_rebalance", Key::URef(storage::new_uref(user)));
}

#[no_mangle]
fn get_position_count() {
    let ct: u64 = 1;
    runtime::ret(CLValue::from_t(ct).unwrap_or_revert());
}
