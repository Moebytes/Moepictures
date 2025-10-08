cmake_minimum_required(VERSION 3.31)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

project(NativeFunctions)

include(FetchContent)
FetchContent_Declare(
  simdjson
  GIT_REPOSITORY https://github.com/simdjson/simdjson
  GIT_TAG        v4.0.7
)
FetchContent_MakeAvailable(simdjson)

add_executable(${PROJECT_NAME} NativeFunctions.cpp)
target_link_libraries(${PROJECT_NAME} PRIVATE simdjson)

set(WASM_FLAGS 
    "-s ENVIRONMENT='web,node' \
    -s MODULARIZE=1 \
    -s EXPORTED_FUNCTIONS='[_parseSpaceEnabledSearch]' \
    -s EXPORTED_RUNTIME_METHODS='[ccall,cwrap]' \
    -s TOTAL_STACK=256MB \
    -s ALLOW_MEMORY_GROWTH=1"
)

set_target_properties(${PROJECT_NAME} PROPERTIES
    LINK_FLAGS "${WASM_FLAGS}"
    OUTPUT_NAME "nativefunctions"
    SUFFIX ".js"
)