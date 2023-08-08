import hashlib



# code for incremental merkle tree

roots = []
H = 3
level_values = [0]*H
current_index = 0

def hash(input1, input2):
    # return a ** b
    return hashlib.sha256((str(input1) + str(input2)).encode('utf-8')).hexdigest()


def print_tree():
    for h in range(H):
        print(f'level {h} : {level_values[h]}')

# insert val on current_index position and update the parent nodes up to the root
def insert(val):
    global current_index
    assert current_index < 2**H, "Merkle tree is full"
    
    current_hash = val
    idx = current_index
    
    hash_pairings = []
    hash_directions = []    # 0: i was on the left, 1: i was on the right
    
    for h in range(H):
        if idx % 2 == 0:
            current_hash = hash(current_hash, level_values[h])
            hash_directions.append(0)
        else:
            current_hash = hash(level_values[h], current_hash)
            hash_directions.append(1)
        idx //= 2
        hash_pairings.append(level_values[h])
        level_values[h] = current_hash
    roots.append(current_hash)
    print(f'\t hash_directions = {hash_directions}')
    print(f'\t hash_pairings = {hash_pairings}')
    print(f'\t roots = {roots}')
    current_index += 1
    
def verify( _val, _root, _hash_pairings, _hash_directions):
    if _root not in roots:
        return False
    current_hash = _val
    for h in range(H):
        if _hash_directions[h] == 0:
            current_hash = hash(current_hash, _hash_pairings[h])
        else:
            current_hash = hash(_hash_pairings[h], current_hash)
    return current_hash == _root    
    
    
print('------------------- t = 0')
print_tree()    
print('------------------- insert 2')
insert(2)
print_tree()    
print('------------------- insert 3')
insert(3)
print_tree()    





print('------------------- verify 2')
print(verify( 2,'537822776ad5458977e920bbea6776c35c29a2fdf8fcf3ecbe0e2cb40d3ba5d3' ,[0, 0, 0], [0, 0, 0]))
print('------------------- verify 3')
print(verify(3, 'fcc5eae70eeffef3113f37a08f578fdaa927fda57e41c24e3d686e5b2a71db25',['f5ca38f748a1d6eaf726b8a42fb575c3c71f1864a8143301782de13da2d9202b', '5fdabb054ba03bc3336e7db5c649345002891c928920b5b37e276e7e4c40f321', '537822776ad5458977e920bbea6776c35c29a2fdf8fcf3ecbe0e2cb40d3ba5d3'], [1, 0, 0]))
print('------------------- verify 3(wrong)')
print(verify(3, 'fcc5eae70eeffef3113f37a08f578fdaa927fda57e41c24e3d686e5b2a71db25',['f5ca38f748a1d6eaf726b8a42fb575c3c71f1864a8143301782de13da2d9202b', '5fdabb054ba03bc3336e7db5c649345002891c928920b5b37e276e7e4c40f321', '537822776ad5458977e920bbea6776c35c29a2fdf8fcf3ecbe0e2cb40d3ba5d3'], [0, 1, 0]))