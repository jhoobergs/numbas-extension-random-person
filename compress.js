#!/usr/bin/env node

const infile = process.argv[2];
const outfile = process.argv[3];

const LZString = require("./lz_string.js");
const fs = require("fs");

const normalize_data = (names_list) => {
  let list = [];
  for (let { name, count } of names_list) {
    list.push([name, count]);
  }
  return list;
};

// Data is of form { "names": {  "neutral": {"name": ..., "count": number}[], "female": [], "male": []}, "totals": {"neutral": number, "female": number, "male": number } }
const calculate_prefix_maps = (data) => {
  let normalized_map = (s) => prefix_map(normalize_data(data["names"][s] || []));
  let normalized_reduced_map = (s) => reduce_prefix_map(normalized_map(s));
  //console.log(JSON.stringify(normalized_reduced_map("male"), null, 2));
  return {
    neutral: normalized_reduced_map("neutral"),
    male: normalized_reduced_map("male"),
    female: normalized_reduced_map("female"),
  };
};

// list is a list of [name, count] pairs
// Returns a (verbose) prefix map
const prefix_map = (list) => {
  let tree = {};
  for (let list_index in list) {
    let item = list[list_index];
    let name = item[0];
    let current_tree = tree;
    for (character_index in name) {
      let character = name[character_index];
      if (Object.keys(current_tree).indexOf(character) === -1) {
        current_tree[character] = {};
      }
      current_tree = current_tree[character];
    }
    current_tree[""] = item[1]; // set the score
  }
  return tree;
};

const is_reducible = (map, key) => {
  let sub_keys = Object.keys(map[key]);
  if (sub_keys.length === 1) {
    return sub_keys[0];
  } else {
    return null;
  }
};

// map is a prefix map
// reduces the prefix map to be as small as possible by combining subnodes that have only one child
const reduce_prefix_map = (map) => {
  let keys_to_reduce = Object.keys(map);
  while (keys_to_reduce.length > 0) {
    let key = keys_to_reduce.pop();
    let subkey = is_reducible(map, key);
    if (subkey !== null) {
      let current = map[key];
      delete map[key];
      map[key + subkey] = current[subkey];
      keys_to_reduce.push(key + subkey); // Let this one be checked again
    } else {
      reduce_prefix_map(map[key]);
    }
  }
  return map;
};

fs.readFile(infile, { encoding: "utf-8" }, (err, data) => {
  //const comp = LZString.compressToUTF16(data);
  const comp = JSON.stringify(calculate_prefix_maps(JSON.parse(data)));
  fs.writeFile(outfile, comp, { encoding: "utf-8" }, (err) => {});
});
