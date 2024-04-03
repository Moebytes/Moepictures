import gibberishModel from "../assets/json/gibberish-model.json"

const characterCounter = (str: string) => {
    let count = 0
    let lastChar = str.charAt(0)
    for (let i = 1; i < str.length; i++) {
        let currentChar = str.charAt(i)
        if (lastChar === currentChar) {
            count++
            if (count > 3) break
            lastChar = currentChar
        } else {
            count = 0
            lastChar = currentChar
        }
    }
    return count > 3 ? true : false
}


let accepted_chars = "abcdefghijklmnopqrstuvwxyz "

let pos = {}

for (let i = 0; i < accepted_chars.length; i++) {
    pos[accepted_chars[i]] = i
}

function normalize(line: string) {
    var arr = line.toLowerCase().split('');
    return arr.filter(function(item) {
        return accepted_chars.indexOf(item) > -1;
    });
}

function averageTransitionProbability(line: string, log_prob_matrix: any) {
    let log_prob = 1.0
    let transition_ct = 0

    var filtered_line = normalize(line)
    var a = false as any

    for (var b in filtered_line) {
        if (a !== false) {
            log_prob += log_prob_matrix[pos[a]][pos[filtered_line[b]]]
            transition_ct += 1
        }
        a = filtered_line[b]
    }

    return Math.exp(log_prob / (transition_ct || 1))
}

const detectGibberish = (line: string) => {
    const val1 = averageTransitionProbability(line, gibberishModel.matrix) <= gibberishModel.threshold
    const val2 = characterCounter(line)
    return [val1, val2].filter(Boolean).length
}

export default detectGibberish