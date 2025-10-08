#include <simdjson.h>
#include <vector>
#include <unordered_map>
#include <string>
#include <algorithm>
#include <functional>
#include <regex>

using namespace simdjson;
using namespace std;

struct Tag {
    string tag;
    vector<string> aliases;
};

class NativeFunctions {
public:
    static auto permutations(const string& query) -> vector<vector<string>> {
        regex regex{"\\s+"};
        sregex_token_iterator it(query.begin(), query.end(), regex, -1);
        sregex_token_iterator end;
        vector<string> sliced(it, end);

        vector<vector<string>> results;

        function<void(vector<string>, vector<string>)> iterRecur =
            [&](vector<string> prefix, vector<string> rest) {
                if (rest.empty()) return results.push_back(prefix);
                vector<string> next(rest.begin() + 1, rest.end());

                auto withHyphen = prefix;
                withHyphen.push_back(rest[0]);
                if (!next.empty()) withHyphen.back() += "-" + next[0];
                results.push_back(withHyphen);

                auto separate = prefix;
                separate.push_back(rest[0]);
                iterRecur(separate, next);
            };

        iterRecur({}, sliced);
        return results;
    }

    static auto indexOfMax(const vector<int>& arr) -> int {
        if (arr.empty()) return -1;
        return distance(arr.begin(), max_element(arr.begin(), arr.end()));
    }

    static auto parseSpaceEnabledSearch(const string& query, const unordered_map<string, Tag>& tagMap) -> string {
        if (query.empty()) return query;

        regex regex{"\\s+"};
        sregex_token_iterator it(query.begin(), query.end(), regex, -1);
        sregex_token_iterator end;
        vector<string> parts(it, end);
        if (parts.size() > 10) return query;

        auto perms = permutations(query);
        vector<int> matchesArray(perms.size(), 0);
        vector<vector<string>> specialFlags(perms.size());

        for (size_t i = 0; i < perms.size(); i++) {
            specialFlags[i].resize(perms[i].size());
            for (size_t j = 0; j < perms[i].size(); j++) {
                string& tags = perms[i][j];

                if (tags.rfind("+-", 0) == 0) { 
                    specialFlags[i][j] = "+-"; 
                    tags = tags.substr(2); 
                }
                if (tags.rfind("+", 0) == 0) { 
                    specialFlags[i][j] = "+"; 
                    tags = tags.substr(1); 
                }
                if (tags.rfind("-", 0) == 0) { 
                    specialFlags[i][j] = "-"; 
                    tags = tags.substr(1); 
                }
                if (tags.rfind("*", 0) == 0) { 
                    specialFlags[i][j] = "*"; 
                    tags = tags.substr(1); 
                }

                if (tagMap.find(tags) != tagMap.end()) matchesArray[i]++;
            }
        }

        for (size_t i = 0; i < perms.size(); ++i) {
            for (const auto& tags : perms[i]) {
                for (const auto& item : tagMap) {
                    const Tag& tag = item.second;
                    if (find(tag.aliases.begin(), tag.aliases.end(), tags) != tag.aliases.end()) {
                        matchesArray[i]++;
                    }
                }
            }
        }

        int index = indexOfMax(matchesArray);
        if (index != -1 && matchesArray[index] != 0) {
            string result;
            for (size_t j = 0; j < perms[index].size(); j++) {
                result += specialFlags[index][j] + perms[index][j];
                if (j != perms[index].size() - 1) result += " ";
            }
            return result;
        }

        return query;
    }
};

extern "C" auto parseSpaceEnabledSearch(const char* query, const char* tagMapStr) -> const char* {
    static string result;

    ondemand::parser parser;
    padded_string json{string{tagMapStr}};
    ondemand::document doc = parser.iterate(json);

    unordered_map<string, Tag> tagMap;
    tagMap.reserve(50000);

    for (auto field : doc.get_object()) {
        string key = string(field.unescaped_key().value());

        auto val = field.value();

        Tag tag;
        if (auto tag_field = val["tag"]; tag_field.error() == SUCCESS) {
            if (auto tag_val = tag_field.get_string(); tag_val.error() == SUCCESS) {
                tag.tag = string(tag_val.value());
            } else {
                tag.tag = key;
            }
        } else {
            tag.tag = key;
        }
    
        if (auto aliases = val["aliases"]; aliases.error() == SUCCESS) {
            if (auto arr = aliases.get_array(); arr.error() == SUCCESS) {
                for (auto alias : arr.value()) {
                    if (auto alias_str = alias.get_string(); alias_str.error() == SUCCESS) {
                        tag.aliases.emplace_back(alias_str.value());
                    }
                }
            }
        }

        tagMap.emplace(std::move(key), std::move(tag));
    }

    result = NativeFunctions::parseSpaceEnabledSearch(query, tagMap);
    return result.c_str();
}