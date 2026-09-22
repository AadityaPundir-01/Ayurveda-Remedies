export const Practice=()=>{
    return(
        <h1>hello</h1>
    );
};


// import React from "react";
// export const App=()=>{
//   return  React.createElement("h1",null,"hello my name is aaditya");
// };



        // **** this is the extra main div headache in dom, to remove this we have frag>ments use <React.Fragment> </React.Fragment> and it must require on top => import React from "react";  ***********
                                                        //another way is only use <></> without any import
/*export const App=()=>{
  return( 
    
  // <div>

  //   <Netflix/>
  //    <Netflix/>
  //     <Netflix/>
  //      <Netflix/>
  //       <Netflix/>
    
  // </div>
  );
}; 
*/

// import Netflix from "./components/Netflixseries";           /its a first way to import by default exports
// import { Netflix} from "./components/Netflixseries"                                                              /* its a second way to import named exports */ 
// export const App=()=>{
//   return( 
//     <>
//      <Netflix/>
//      <Netflix/>
//       <Netflix/>
//        <Netflix/>
//         <Netflix/>
//        </>
//       );
// };