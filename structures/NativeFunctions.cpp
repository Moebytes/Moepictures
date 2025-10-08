#include <napi.h>
#include <unordered_map>
#include <vector>
#include <string>
#include <regex>
#include <functional>
#include <algorithm>

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

Napi::Value ParseSpaceEnabledSearch(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    string query = info[0].As<Napi::String>().Utf8Value();
    Napi::Object obj = info[1].As<Napi::Object>();

    unordered_map<string, Tag> tagMap;
    Napi::Array keys = obj.GetPropertyNames();
    tagMap.reserve(keys.Length());

    for (uint32_t i = 0; i < keys.Length(); i++) {
        string key = keys.Get(i).As<Napi::String>().Utf8Value();
        Napi::Object val = obj.Get(key).As<Napi::Object>();

        Tag tag;
        tag.tag = val.Has("tag") ? val.Get("tag").As<Napi::String>().Utf8Value() : key;

        if (val.Has("aliases")) {
            Napi::Array aliases = val.Get("aliases").As<Napi::Array>();
            for (uint32_t j = 0; j < aliases.Length(); ++j) {
                if (aliases.Get(j).IsString()) {
                    tag.aliases.push_back(aliases.Get(j).As<Napi::String>().Utf8Value());
                }
            }
        }

        tagMap.emplace(std::move(key), std::move(tag));
    }

    string result = NativeFunctions::parseSpaceEnabledSearch(query, tagMap);
    return Napi::String::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("parseSpaceEnabledSearch", Napi::Function::New(env, ParseSpaceEnabledSearch));
    return exports;
}

NODE_API_MODULE(addon, Init)