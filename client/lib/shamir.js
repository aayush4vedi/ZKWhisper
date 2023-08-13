const { split, join } = require("shamir")
const { randomBytes } = require("crypto")
const { BigNumber, ethers, utils }  = require("ethers")


// the total number of shares
const PARTS = 5
// the minimum required to recover
const QUORUM = 3
// you can use any polyfill to covert between string and Uint8Array
const utf8Encoder = new TextEncoder()
const utf8Decoder = new TextDecoder()

const GenerateLongRandomNumbers = (n) => {
    const randomBytes = ethers.utils.randomBytes(n)
    const bigNumRandomBytes = BigNumber.from(randomBytes)
    return BigInt(bigNumRandomBytes)
}


function doIt() {
    const secret = "hello there"
    // const secret = GenerateLongRandomNumbers(64).toString(16)
    console.log("secrect: ", secret)
    const secretBytes = utf8Encoder.encode(secret)
    // parts is a object whos keys are the part number and
    // values are shares of type Uint8Array
    const parts = split(randomBytes, PARTS, QUORUM, secretBytes)

    console.log("-----------> size = ", Object.keys(JSON.stringify(parts)).length)
    console.log('-----------> parts = ', JSON.stringify(parts))
    
    // for (let i = 0; i < PARTS; i++) {
    //     console.log(`\t==============> type parts[${i+1}] : ${typeof parts[i+1]}`)
    //     console.log(`\t==============> parts[${i+1}] : ${parts[i+1]}`)
    //     // console.log(`\t==============> parts[${i}][1] : ${parts[i][1]}`)
    // }

    // const partsList = []
    // for (let i = 0; i < PARTS; i++) {
    //     partsList.push(parts[i + 1])
    // }
    // console.log("-----------> partsList = ", partsList)
    // const slicedParts = partsList.slice(0, QUORUM)

    // const jsonObjectReduce = slicedParts.reduce((acc, item, index) => {
    //     acc[index] = item
    //     return acc
    // }, {})
    // console.log("-----------> jsonObjectReduce = ", jsonObjectReduce)

    const parts2 = Object.entries(parts).map(([key, value]) => ({ [key]: value }))
    console.log("-----------> parts2 = ", parts2)
    console.log("-----------> parts2[0] = ", parts2[0])
    
    parts2New = []
    for (let i = 0; i < 3; i++) {
        parts2New.push(parts2[i])
    }
    console.log("-----------> parts2New = ", parts2New)
    // parts2New = [parts2[0], parts2[4], parts2[2]]
    
    const reconstructedparts2 = parts2New.reduce((acc, part) => {
        const [key, value] = Object.entries(part)[0]
        acc[key] = value
        return acc
    }, {})
    
    console.log("-----------> reconstructedparts2 = ", reconstructedparts2)
    // we only need QUORUM parts to recover the secret
    // to prove this we will delete two parts
    delete parts[2]
    delete parts[3]
    // we can join three parts to recover the original Unit8Array
    // const recovered = join(parts)
    const lengths = Object.values(reconstructedparts2).map((x) => x.length)
    const max = Math.max.apply(null, lengths)
    const min = Math.min.apply(null, lengths)

    console.log("-----------> lengths = ", lengths)
    console.log("-----------> min = ", min)
    console.log("-----------> max = ", max)


    const recovered = join(reconstructedparts2)


    // const myRecoved = join(jsonObjectReduce)
    // prints 'hello there'
    // console.log(utf8Decoder.decode(myRecoved))
    console.log(utf8Decoder.decode(recovered))
}


doIt()

/**
-----------> stringify(reconstructedparts) =  
{"1":{"0":{"0":167,"1":47,"2":212,"3":228,"4":164,"5":78}},
"3":{"0":{"0":41,"1":30,"2":3,"3":189,"4":117,"5":135}},
"4":{"0":{"0":128,"1":165,"2":104,"3":99,"4":231,"5":63}}}
 * 
 */